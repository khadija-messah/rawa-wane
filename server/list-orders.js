// Prints the latest orders from the database: `npm run orders` (or `npm run orders -- 50`).

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDatabase } from './db.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const db = openDatabase(process.env.DB_FILE || path.join(ROOT, 'data', 'rawane.db'));
const limit = Number(process.argv[2]) || 20;

const orders = db.recentOrders(limit);
if (!orders.length) console.log('Aucune commande pour le moment.');

for (const o of orders) {
  console.log(`\n${o.order_number}  ·  ${o.created_at}  ·  ${o.status}`);
  console.log(`  ${o.first_name} ${o.last_name}  ·  ${o.phone}`);
  console.log(`  ${o.address}, ${o.city}`);
  for (const i of db.itemsOf(o.id)) {
    const opts = Object.entries(JSON.parse(i.options)).map(([k, v]) => `${k} ${v}`).join(', ');
    console.log(`  - ${i.quantity} × ${i.product_name}${opts ? ` (${opts})` : ''} — ${i.line_total} ${o.currency}`);
  }
  console.log(`  Sous-total ${o.subtotal} · Livraison ${o.shipping} · Total ${o.total} ${o.currency} · paiement à la livraison`);
}
db.close();
