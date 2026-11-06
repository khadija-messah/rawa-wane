# RAWANE — Maison de bijoux

Portfolio demo: a static storefront built with plain HTML, CSS and vanilla JavaScript ES modules. No build step, no backend, no database. It is not a real store.

## Run locally

```bash
npm run dev        # python3 -m http.server 5180 → http://localhost:5180
```

ES modules need to be served over HTTP (opening `index.html` directly from disk will not load the scripts). Any static host works.

## Structure

```
index.html              page layout (sections, overlays)
css/styles.css          design tokens, components, responsive rules
js/data/products.js     ← catalogue: products, categories, featured collection, shop settings
js/store.js             cart + wishlist state (persisted in localStorage)
js/templates.js         HTML templates (product card, cart line, quick view…)
js/main.js              rendering, routing, carousel, search, drawers, quick view
js/checkout.js          simulated checkout: form, order summary, confirmation
js/checkout-rules.js    customer form validation and shipping rule
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

## Checkout (simulated)

"Passer commande" opens the checkout: last name, first name, Moroccan phone, address, city, and a summary with shipping, total and cash on delivery.

Confirming validates the form, waits briefly, shows a demo reference such as `RAW-2026-001` with the order summary, and empties the cart. The confirmation states that the order is simulated.

- Nothing is sent over the network and customer details are never stored.
- The only thing saved for checkout is the reference counter, in `localStorage` (`rawane:demo-order-seq`).
- Shipping: free from `shop.freeShippingThreshold` (500 MAD), otherwise `shop.shippingFee` (35 MAD). Both are demo values.

## Also front-end only

Account shows a "coming soon" message, and the newsletter validates the e-mail but sends nothing.
