// RAWANE server: serves the storefront and records cash-on-delivery orders in SQLite.
// Zero dependencies — needs Node 22.13+ (built-in node:sqlite). Run with `npm run dev`.

import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomInt } from 'node:crypto';
import { products, shop, currency } from '../js/data/products.js';
import { validateCustomer, priceItems, shippingFor, OrderError } from '../js/checkout-rules.js';
import { openDatabase } from './db.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT) || 5173;
const DB_FILE = process.env.DB_FILE || path.join(ROOT, 'data', 'rawane.db');

const db = openDatabase(DB_FILE);
const productsById = new Map(products.map((p) => [p.id, p]));

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

// Only the storefront is public — never the database, server code or project files.
const PUBLIC = ['/index.html', '/css/', '/js/', '/assets/'];

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(Object.assign(new Error('Payload too large'), { status: 413 }));
        req.destroy();
      } else chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

// Unambiguous characters (no 0/O, 1/I/L) so the number is easy to read over the phone.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function orderNumber(date) {
  const stamp = date.toISOString().slice(2, 10).replaceAll('-', '');
  let suffix = '';
  for (let i = 0; i < 5; i++) suffix += ALPHABET[randomInt(ALPHABET.length)];
  return `RWN-${stamp}-${suffix}`;
}

// Basic per-IP throttle against scripted spam (in memory; resets on restart).
const attempts = new Map();
function throttled(ip) {
  const now = Date.now();
  const recent = (attempts.get(ip) || []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  attempts.set(ip, recent);
  return recent.length > 10;
}

const publicOrder = (o) => ({
  orderNumber: o.order_number ?? o.orderNumber,
  subtotal: o.subtotal,
  shipping: o.shipping,
  total: o.total,
  currency: o.currency,
  createdAt: o.created_at ?? o.createdAt,
});

/* ------------------------------------------------------------------ */
/* POST /api/orders                                                    */
/* ------------------------------------------------------------------ */

async function createOrder(req, res) {
  if (!String(req.headers['content-type']).startsWith('application/json')) {
    return sendJson(res, 415, { error: 'Format de requête non pris en charge.' });
  }
  if (throttled(req.socket.remoteAddress)) {
    return sendJson(res, 429, { error: 'Trop de tentatives. Merci de patienter quelques minutes avant de réessayer.' });
  }

  let body;
  try {
    body = JSON.parse(await readBody(req, 16_384));
  } catch (err) {
    return sendJson(res, err.status || 400, { error: 'Requête invalide.' });
  }

  // Idempotency: a retry of the same checkout attempt returns the order already saved.
  const requestId = typeof body?.requestId === 'string' && /^[\w-]{8,64}$/.test(body.requestId) ? body.requestId : null;
  if (requestId) {
    const existing = db.findByRequestId(requestId);
    if (existing) return sendJson(res, 200, publicOrder(existing));
  }

  const { values: customer, errors, ok } = validateCustomer(body?.customer);
  if (!ok) return sendJson(res, 422, { error: 'Certains champs sont à corriger.', fields: errors });

  let priced;
  try {
    priced = priceItems(body?.items, productsById);
  } catch (err) {
    if (err instanceof OrderError) return sendJson(res, 409, { error: err.message });
    throw err;
  }

  const shipping = shippingFor(priced.subtotal, shop);
  const created = new Date();
  const order = {
    requestId,
    customer,
    lines: priced.lines,
    paymentMethod: 'cash_on_delivery',
    subtotal: priced.subtotal,
    shipping,
    total: priced.subtotal + shipping,
    currency: currency.code,
    createdAt: created.toISOString(),
  };

  for (let attempt = 0; ; attempt++) {
    order.orderNumber = orderNumber(created);
    try {
      db.createOrder(order);
      break;
    } catch (err) {
      const msg = String(err.message);
      if (msg.includes('orders.request_id')) return sendJson(res, 200, publicOrder(db.findByRequestId(requestId)));
      if (msg.includes('orders.order_number') && attempt < 5) continue;
      throw err;
    }
  }

  console.log(`[order] ${order.orderNumber} · ${customer.firstName} ${customer.lastName} · ${order.total} ${order.currency}`);
  sendJson(res, 201, publicOrder(order));
}

/* ------------------------------------------------------------------ */
/* Static files                                                        */
/* ------------------------------------------------------------------ */

async function serveStatic(req, res, pathname) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' });
    return res.end();
  }
  const rel = pathname === '/' ? '/index.html' : path.posix.normalize(pathname);
  const file = path.join(ROOT, rel);
  if (!PUBLIC.some((p) => rel === p || rel.startsWith(p)) || !file.startsWith(ROOT + path.sep)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Not found');
  }
  try {
    const data = await readFile(file);
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
}

/* ------------------------------------------------------------------ */

const server = http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  try {
    const { pathname } = new URL(req.url, 'http://localhost');
    const decoded = decodeURIComponent(pathname);
    if (decoded === '/api/orders') {
      if (req.method === 'POST') return await createOrder(req, res);
      res.writeHead(405, { Allow: 'POST' });
      return res.end();
    }
    await serveStatic(req, res, decoded);
  } catch (err) {
    console.error('[error]', err);
    if (!res.headersSent) {
      sendJson(res, 500, { error: 'Une erreur est survenue lors de l’enregistrement de votre commande. Veuillez réessayer.' });
    } else res.end();
  }
});

server.listen(PORT, () => {
  console.log(`RAWANE → http://localhost:${PORT}  (orders: ${path.relative(ROOT, DB_FILE)})`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => { db.close(); process.exit(0); }));
}
