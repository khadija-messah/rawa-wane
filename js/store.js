// Cart and wishlist state, persisted in localStorage and broadcast to subscribers.

const CART_KEY = 'rawane:cart';
const WISH_KEY = 'rawane:wishlist';

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable (private mode) — state stays in memory */
  }
}

/** A cart line is identified by product id + chosen variant labels. */
export const lineKey = (productId, selection = {}) =>
  [productId, ...Object.entries(selection).sort().map(([k, v]) => `${k}=${v}`)].join('|');

export function createStore(productsById) {
  // Drop lines whose product no longer exists in the catalogue.
  let cart = load(CART_KEY, []).filter((l) => productsById.has(l.productId));
  let wishlist = new Set(load(WISH_KEY, []).filter((id) => productsById.has(id)));
  const listeners = new Set();

  const emit = (change) => {
    save(CART_KEY, cart);
    save(WISH_KEY, [...wishlist]);
    listeners.forEach((fn) => fn(change));
  };

  const unitPrice = (line) => {
    const product = productsById.get(line.productId);
    const delta = (product.variants || []).reduce((sum, group) => {
      const opt = group.options.find((o) => o.label === line.selection[group.name]);
      return sum + (opt?.priceDelta || 0);
    }, 0);
    return product.price + delta;
  };

  return {
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    get lines() {
      return cart.map((l) => ({ ...l, product: productsById.get(l.productId), unit: unitPrice(l) }));
    },
    get count() {
      return cart.reduce((n, l) => n + l.qty, 0);
    },
    get subtotal() {
      return cart.reduce((sum, l) => sum + unitPrice(l) * l.qty, 0);
    },

    add(productId, selection = {}, qty = 1) {
      const key = lineKey(productId, selection);
      const existing = cart.find((l) => l.key === key);
      if (existing) existing.qty = Math.min(existing.qty + qty, 10);
      else cart.push({ key, productId, selection, qty });
      emit({ type: 'add', productId });
    },
    setQty(key, qty) {
      cart = qty <= 0 ? cart.filter((l) => l.key !== key) : cart.map((l) => (l.key === key ? { ...l, qty: Math.min(qty, 10) } : l));
      emit({ type: 'qty' });
    },
    remove(key) {
      cart = cart.filter((l) => l.key !== key);
      emit({ type: 'remove' });
    },
    clear() {
      cart = [];
      emit({ type: 'clear' });
    },

    isWished: (id) => wishlist.has(id),
    toggleWish(id) {
      if (wishlist.has(id)) wishlist.delete(id);
      else wishlist.add(id);
      emit({ type: 'wish', productId: id, wished: wishlist.has(id) });
      return wishlist.has(id);
    },
  };
}
