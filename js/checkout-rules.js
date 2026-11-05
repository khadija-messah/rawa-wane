// Checkout rules shared by the browser (instant feedback) and the server (source of truth).
// No DOM or Node APIs here so both sides can import it.

export const FIELDS = ['lastName', 'firstName', 'phone', 'address', 'city'];

const MAX = { lastName: 60, firstName: 60, phone: 24, address: 240, city: 60 };
const NAME_RE = /^\p{L}[\p{L}\p{M}' .-]*$/u;

/**
 * Moroccan numbers: 05 / 06 / 07 followed by 8 digits, written 0X…, +212X…, 00212X… or 212X….
 * Spaces, dots, dashes and parentheses are ignored. Returns +212XXXXXXXXX or null.
 */
export function normalizePhone(raw = '') {
  const compact = String(raw).replace(/[\s.\-()]/g, '');
  const m = compact.match(/^(?:\+212|00212|212|0)([5-7]\d{8})$/);
  return m ? `+212${m[1]}` : null;
}

/** Validates the customer form. `errors` maps field → French message; `values` are trimmed (phone normalised). */
export function validateCustomer(input = {}) {
  const values = {};
  for (const key of FIELDS) values[key] = String(input?.[key] ?? '').trim().replace(/\s+/g, ' ');
  const errors = {};

  for (const [key, label] of [['lastName', 'nom'], ['firstName', 'prénom']]) {
    const v = values[key];
    if (!v) errors[key] = `Veuillez indiquer votre ${label}.`;
    else if (v.length < 2) errors[key] = `Votre ${label} doit contenir au moins 2 lettres.`;
    else if (v.length > MAX[key]) errors[key] = `Votre ${label} est trop long (${MAX[key]} caractères maximum).`;
    else if (!NAME_RE.test(v)) errors[key] = `Votre ${label} ne doit contenir que des lettres.`;
  }

  if (!values.phone) errors.phone = 'Veuillez indiquer votre numéro de téléphone.';
  else {
    const phone = values.phone.length <= MAX.phone ? normalizePhone(values.phone) : null;
    if (phone) values.phone = phone;
    else errors.phone = 'Numéro marocain invalide. Exemple : 06 12 34 56 78 ou +212 6 12 34 56 78.';
  }

  if (!values.address) errors.address = 'Veuillez indiquer votre adresse de livraison.';
  else if (values.address.length < 8) errors.address = 'Merci de préciser votre adresse (numéro, rue, quartier).';
  else if (values.address.length > MAX.address) errors.address = `Adresse trop longue (${MAX.address} caractères maximum).`;

  if (!values.city) errors.city = 'Veuillez indiquer votre ville.';
  else if (values.city.length < 2 || values.city.length > MAX.city || !NAME_RE.test(values.city)) {
    errors.city = 'Veuillez indiquer un nom de ville valide.';
  }

  return { values, errors, ok: Object.keys(errors).length === 0 };
}

export const MAX_QTY = 10;

/** Shipping is free from the threshold upwards, otherwise the flat fee. */
export function shippingFor(subtotal, shop) {
  return subtotal === 0 || subtotal >= shop.freeShippingThreshold ? 0 : shop.shippingFee;
}

export class OrderError extends Error {}

/**
 * Prices cart items against the catalogue. Never trusts prices sent by the client.
 * items: [{ productId, selection: { [variantName]: optionLabel }, qty }]
 */
export function priceItems(items, productsById) {
  if (!Array.isArray(items) || items.length === 0) throw new OrderError('Votre panier est vide.');
  if (items.length > 50) throw new OrderError('Votre panier contient trop d’articles.');

  const lines = items.map((item) => {
    const product = productsById.get(item?.productId);
    if (!product) throw new OrderError('Un article de votre panier n’est plus disponible. Merci de le retirer puis de réessayer.');

    const qty = Number(item.qty);
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) throw new OrderError(`Quantité invalide pour ${product.name}.`);

    const selection = item.selection && typeof item.selection === 'object' ? item.selection : {};
    let unit = product.price;
    const options = {};
    for (const group of product.variants) {
      const opt = group.options.find((o) => o.label === selection[group.name]);
      if (!opt) throw new OrderError(`Merci de choisir une option « ${group.name} » pour ${product.name}.`);
      if (opt.soldOut) throw new OrderError(`${product.name} (${group.name} ${opt.label}) est épuisé. Merci de le retirer du panier.`);
      unit += opt.priceDelta || 0;
      options[group.name] = opt.label;
    }
    return { productId: product.id, name: product.name, options, unitPrice: unit, qty, lineTotal: unit * qty };
  });

  return { lines, subtotal: lines.reduce((sum, l) => sum + l.lineTotal, 0) };
}
