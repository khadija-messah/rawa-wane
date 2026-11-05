// Checkout: cash-on-delivery order form, summary and confirmation.
// The order only counts as placed once the server answers with an order number.

import { shop } from './data/products.js';
import { money, checkoutLine } from './templates.js';
import { FIELDS, validateCustomer, shippingFor } from './checkout-rules.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const TIMEOUT_MS = 15_000;
const MSG = {
  network: 'Impossible de joindre notre serveur. Vérifiez votre connexion puis réessayez — votre panier et vos informations sont conservés.',
  timeout: 'Le serveur met trop de temps à répondre. Veuillez réessayer — votre panier et vos informations sont conservés.',
  generic: 'Votre commande n’a pas pu être enregistrée. Veuillez réessayer — votre panier et vos informations sont conservés.',
  fields: 'Merci de corriger les champs indiqués en rouge.',
};

const newRequestId = () =>
  crypto.randomUUID?.() ?? [...crypto.getRandomValues(new Uint8Array(16))].map((b) => b.toString(16).padStart(2, '0')).join('');

export function initCheckout({ store, openOverlay, cart }) {
  const root = $('[data-checkout-view]');
  const panel = $('[data-co-panel]', root);
  const form = $('[data-co-form]', root);
  const formView = $('[data-co-form-view]', root);
  const doneView = $('[data-co-done]', root);
  const alertBox = $('[data-co-alert]', root);
  const submitBtn = $('[data-co-submit]', root);
  const backBtn = $('[data-co-back]', root);

  // One id per checkout attempt: a retry after a lost response cannot create a second order.
  let requestId = newRequestId();
  let submitting = false;
  let attempted = false;

  function renderSummary() {
    const lines = store.lines;
    const subtotal = store.subtotal;
    const shipping = shippingFor(subtotal, shop);
    $('[data-co-lines]', root).innerHTML = lines.map(checkoutLine).join('');
    $('[data-co-count]', root).textContent = `(${store.count} article${store.count > 1 ? 's' : ''})`;
    $('[data-co-subtotal]', root).textContent = money(subtotal);
    $('[data-co-shipping]', root).textContent = shipping ? money(shipping) : 'Offerte';
    $('[data-co-total]', root).textContent = money(subtotal + shipping);
    $('[data-co-ship-note]', root).textContent = shipping
      ? `Livraison offerte dès ${money(shop.freeShippingThreshold)} d’achat.`
      : 'La livraison vous est offerte.';
  }

  /* ---------------- field errors ---------------- */

  function setFieldError(name, message) {
    const input = form.elements[name];
    const slot = $(`[data-error-for="${name}"]`, form);
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    slot.textContent = message || '';
  }

  function showErrors(errors) {
    FIELDS.forEach((name) => setFieldError(name, errors[name]));
  }

  function showAlert(message) {
    alertBox.textContent = message || '';
    alertBox.hidden = !message;
  }

  const readForm = () => Object.fromEntries(FIELDS.map((name) => [name, form.elements[name].value]));

  // Re-check a field when the customer leaves it (once they've tried to submit, or typed something).
  form.addEventListener('focusout', (e) => {
    const name = e.target.name;
    if (!FIELDS.includes(name) || (!attempted && !e.target.value.trim())) return;
    setFieldError(name, validateCustomer(readForm()).errors[name]);
  });
  // Clear an error as soon as the value becomes valid.
  form.addEventListener('input', (e) => {
    const name = e.target.name;
    if (FIELDS.includes(name) && e.target.getAttribute('aria-invalid') === 'true' && !validateCustomer(readForm()).errors[name]) {
      setFieldError(name, '');
    }
  });

  /* ---------------- submission ---------------- */

  function setBusy(on) {
    submitting = on;
    root.dataset.busy = String(on);
    submitBtn.disabled = on;
    submitBtn.classList.toggle('is-busy', on);
    submitBtn.setAttribute('aria-busy', String(on));
    $('[data-co-submit-label]', submitBtn).textContent = on ? 'Enregistrement en cours…' : 'Confirmer ma commande';
    $$('input, textarea, [data-co-back], [data-close]', root).forEach((el) => { el.disabled = on; });
  }

  async function postOrder(payload) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      const data = await res.json().catch(() => ({}));
      return { res, data };
    } finally {
      clearTimeout(timer);
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (submitting) return;
    attempted = true;

    const { errors, ok } = validateCustomer(readForm());
    showErrors(errors);
    if (!ok) {
      showAlert(MSG.fields);
      form.elements[FIELDS.find((name) => errors[name])].focus();
      return;
    }
    if (!store.count) return showAlert('Votre panier est vide.');

    showAlert('');
    setBusy(true);
    try {
      const { res, data } = await postOrder({
        requestId,
        customer: readForm(),
        items: store.lines.map((l) => ({ productId: l.productId, selection: l.selection, qty: l.qty })),
      });
      if (res.ok && data.orderNumber) return succeed(data);
      if (res.status === 422 && data.fields) {
        showErrors(data.fields);
        showAlert(MSG.fields);
      } else showAlert(data.error || MSG.generic);
    } catch (err) {
      showAlert(err.name === 'AbortError' ? MSG.timeout : MSG.network);
    } finally {
      if (submitting) setBusy(false);
    }
  });

  function succeed(order) {
    setBusy(false);
    $('[data-co-number]', root).textContent = order.orderNumber;
    $('[data-co-done-total]', root).textContent = money(order.total);
    formView.hidden = true;
    doneView.hidden = false;
    backBtn.hidden = true; // the cart is empty now
    panel.scrollTop = 0;
    // Only now, with the order saved server-side, is the cart emptied.
    store.clear();
    form.reset();
    showErrors({});
    attempted = false;
    requestId = newRequestId();
    $('[data-co-done-title]', root).focus({ preventScroll: true });
  }

  /* ---------------- open / navigation ---------------- */

  function open() {
    if (!store.count) return;
    renderSummary();
    showAlert('');
    formView.hidden = false;
    doneView.hidden = true;
    backBtn.hidden = false;
    panel.scrollTop = 0;
    openOverlay(root);
  }

  store.subscribe((change) => {
    if (change.type === 'wish') return;
    if (change.type !== 'clear') requestId = newRequestId(); // a different cart is a different order
    if (!formView.hidden) renderSummary();
  });

  $('[data-checkout]').addEventListener('click', open);
  backBtn.addEventListener('click', () => openOverlay(cart));
}
