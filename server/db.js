// SQLite storage for orders, using Node's built-in driver (no dependency to install).

import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const SCHEMA = `
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS orders (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number    TEXT    NOT NULL UNIQUE,
    request_id      TEXT    UNIQUE,
    status          TEXT    NOT NULL DEFAULT 'nouvelle',
    last_name       TEXT    NOT NULL,
    first_name      TEXT    NOT NULL,
    phone           TEXT    NOT NULL,
    address         TEXT    NOT NULL,
    city            TEXT    NOT NULL,
    payment_method  TEXT    NOT NULL DEFAULT 'cash_on_delivery',
    subtotal        INTEGER NOT NULL,
    shipping        INTEGER NOT NULL,
    total           INTEGER NOT NULL,
    currency        TEXT    NOT NULL,
    created_at      TEXT    NOT NULL
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id      INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id    TEXT    NOT NULL,
    product_name  TEXT    NOT NULL,
    options       TEXT    NOT NULL,
    unit_price    INTEGER NOT NULL,
    quantity      INTEGER NOT NULL,
    line_total    INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS order_items_order ON order_items(order_id);
  CREATE INDEX IF NOT EXISTS orders_created ON orders(created_at);
`;

export function openDatabase(file) {
  mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(SCHEMA);

  const insertOrder = db.prepare(`
    INSERT INTO orders (order_number, request_id, last_name, first_name, phone, address, city,
                        payment_method, subtotal, shipping, total, currency, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const insertItem = db.prepare(`
    INSERT INTO order_items (order_id, product_id, product_name, options, unit_price, quantity, line_total)
    VALUES (?, ?, ?, ?, ?, ?, ?)`);
  const byRequest = db.prepare('SELECT * FROM orders WHERE request_id = ?');
  const recent = db.prepare('SELECT * FROM orders ORDER BY id DESC LIMIT ?');
  const itemsOf = db.prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY id');

  return {
    findByRequestId: (requestId) => byRequest.get(requestId),
    recentOrders: (limit = 20) => recent.all(limit),
    itemsOf: (orderId) => itemsOf.all(orderId),

    /** Inserts the order and its lines atomically: either everything is saved or nothing is. */
    createOrder(o) {
      db.exec('BEGIN IMMEDIATE');
      try {
        const { lastInsertRowid } = insertOrder.run(
          o.orderNumber, o.requestId, o.customer.lastName, o.customer.firstName, o.customer.phone,
          o.customer.address, o.customer.city, o.paymentMethod, o.subtotal, o.shipping, o.total, o.currency, o.createdAt,
        );
        for (const l of o.lines) {
          insertItem.run(lastInsertRowid, l.productId, l.name, JSON.stringify(l.options), l.unitPrice, l.qty, l.lineTotal);
        }
        db.exec('COMMIT');
        return lastInsertRowid;
      } catch (err) {
        db.exec('ROLLBACK');
        throw err;
      }
    },

    close: () => db.close(),
  };
}
