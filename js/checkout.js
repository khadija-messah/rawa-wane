// Checkout simulation for this portfolio demo: nothing leaves the browser.
// No order is transmitted and customer details are never stored.

import { shop } from './data/products.js';
import { money, checkoutLine } from './templates.js';
import { FIELDS, validateCustomer, shippingFor } from './checkout-rules.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const SIMULATED_DELAY_MS = 900;
const SEQ_KEY = 'rawane:demo-order-seq';
const MSG_FIELDS = 'Merci de corriger les champs indiqués en rouge.';

// Demo reference such as RAW-2026-001. Only the counter is kept, in this browser.
let memorySeq = 0;
function nextReference() {
  let seq = memorySeq + 1;
  try {
    seq = Math.max(seq, (Number(localStorage.getItem(SEQ_KEY)) || 0) + 1);
    localStorage.setItem(SEQ_KEY, String(seq));
  } catch {
    /* storage unavailable (private mode) — the counter stays in memory */
  }
  memorySeq = seq;
  return `RAW-${new Date().getFullYear()}-${String(seq).padStart(3, '0')}`;
}

export function initCheckout({ store, openOverlay, cart }) {
  const root = $('[data-checkout-view]');
  const panel = $('[data-co-panel]', root);
  const form = $('[data-co-form]', root);
  const formView = $('[data-co-form-view]', root);
  const doneView = $('[data-co-done]', root);
  const alertBox = $('[data-co-alert]', root);
  const submitBtn = $('[data-co-submit]', root);
  const backBtn = $('[data-co-back]', root);

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
    $('[data-co-submit-label]', submitBtn).textContent = on ? 'Confirmation en cours…' : 'Confirmer ma commande';
    $$('input, textarea, [data-co-back], [data-close]', root).forEach((el) => { el.disabled = on; });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (submitting) return;
    attempted = true;

    const { errors, ok } = validateCustomer(readForm());
    showErrors(errors);
    if (!ok) {
      showAlert(MSG_FIELDS);
      form.elements[FIELDS.find((name) => errors[name])].focus();
      return;
    }
    if (!store.count) return showAlert('Votre panier est vide.');

    showAlert('');
    setBusy(true);
    await new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY_MS));
    confirmDemoOrder();
  });

  function confirmDemoOrder() {
    const subtotal = store.subtotal;
    const shipping = shippingFor(subtotal, shop);
    setBusy(false);
    $('[data-co-number]', root).textContent = nextReference();
    $('[data-co-done-lines]', root).innerHTML = store.lines.map(checkoutLine).join('');
    $('[data-co-done-subtotal]', root).textContent = money(subtotal);
    $('[data-co-done-shipping]', root).textContent = shipping ? money(shipping) : 'Offerte';
    $('[data-co-done-total]', root).textContent = money(subtotal + shipping);
    formView.hidden = true;
    doneView.hidden = false;
    backBtn.hidden = true; // the cart is empty now
    panel.scrollTop = 0;
    store.clear();
    form.reset();
    showErrors({});
    attempted = false;
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
    if (!formView.hidden) renderSummary();
  });

  $('[data-checkout]').addEventListener('click', open);
  backBtn.addEventListener('click', () => openOverlay(cart));
}
