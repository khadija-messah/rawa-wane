// Checkout rules: customer form validation and shipping.

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

/** Shipping is free from the threshold upwards, otherwise the flat fee. */
export function shippingFor(subtotal, shop) {
  return subtotal === 0 || subtotal >= shop.freeShippingThreshold ? 0 : shop.shippingFee;
}
