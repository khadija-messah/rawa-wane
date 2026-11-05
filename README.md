# RAWANE — Maison de bijoux

Storefront built with plain HTML, CSS and vanilla JavaScript ES modules (no build step), plus a small Node server that records cash-on-delivery orders in SQLite. No dependencies to install.

## Run locally

Requires Node 22.13+ (uses the built-in `node:sqlite`).

```bash
npm run dev        # → http://localhost:5173 (site + order API)
npm run orders     # print the latest orders (npm run orders -- 50 for more)
```

## Structure

```
index.html              page layout (sections, overlays)
css/styles.css          design tokens, components, responsive rules
js/data/products.js     ← catalogue: products, categories, featured collection, shop settings
js/store.js             cart + wishlist state (persisted in localStorage)
js/templates.js         HTML templates (product card, cart line, quick view…)
js/main.js              rendering, routing, carousel, search, drawers, quick view
js/checkout.js          checkout form, order summary, submission, confirmation
js/checkout-rules.js    validation + pricing rules shared by browser and server
server/index.js         Node server: static files + POST /api/orders
server/db.js            SQLite schema (orders, order_items) and queries
server/list-orders.js   `npm run orders`
data/rawane.db          the order database (created on first run, git-ignored)
assets/brand/           monogram (favicon) and wordmark SVGs
assets/images/          product + editorial photography (see CREDITS.md)
```

## Editing products

Everything product-related lives in `js/data/products.js`; the UI renders from it.

- Add a product: append an object to `products` (see the shape documented at the top of the file) and drop a 4:5 photo in `assets/images/products/`.
- Featured carousel: tag a product with `'lumiere'`.
- Badges: `'nouveau'`, `'best-seller'`, or set `compareAt` for a sale price.
- Variants: `variants: [{ name: 'Taille', options: [{ label: 'S', priceDelta: -20 }, { label: 'M', soldOut: true }] }]`.
- `materials` is `null` everywhere on purpose — the catalogue is mock data and composition has not been verified. Once you have real supplier data, set it and it appears in the product sheet.

## Routes (hash-based)

- `#/boutique` — all products
- `#/collections/<category-id>` — filtered shop (`colliers`, `bagues`, `boucles`, `bracelets`)
- `#/produit/<product-id>` — product quick view (shareable link)

## Orders (cash on delivery)

"Passer commande" opens the checkout: last name, first name, Moroccan phone, address, city, and a summary with shipping and total. No card details are ever requested.

- `POST /api/orders` validates the customer again on the server and **recomputes every price from `js/data/products.js`** (prices sent by the browser are ignored; sold-out options are refused).
- Each order and its lines are written in one SQLite transaction, with a unique number like `RWN-261029-K7M4Q`.
- The browser sends a per-attempt `requestId`, so a retry after a lost response returns the same order instead of creating a duplicate.
- The cart is emptied only after the server confirms the order. On any failure the customer sees an error, and their cart and form stay as they were.
- Shipping: free from `shop.freeShippingThreshold` (500 MAD), otherwise `shop.shippingFee` (35 MAD — placeholder, set your real rate).

### Going live

The site now needs a host that runs Node (a VPS, Render, Railway, Fly.io…) with a **persistent disk** for `data/rawane.db` — a purely static host can no longer take orders. Set `PORT` and optionally `DB_FILE`, serve it over HTTPS, and back up the database file regularly. There is no admin screen yet: read orders with `npm run orders` (or any SQLite viewer).

## Not wired yet

Account and newsletter are front-end only (account shows a "coming soon" message; the newsletter validates the e-mail but sends nothing). No order notification (e-mail/WhatsApp) is sent yet. The 14-day returns copy is a placeholder to align with your real policies.
