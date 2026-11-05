// Pure HTML template functions. They receive data and return markup strings.

import { currency } from './data/products.js';

const fmt = new Intl.NumberFormat(currency.locale, { maximumFractionDigits: 0 });
export const money = (n) => `${fmt.format(n)} ${currency.code}`;

export const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const heart = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.2 4.3 4.3 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10Z"/></svg>';
const close = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
const arrow = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-5-5 5 5-5 5"/></svg>';

function badge(p) {
  if (p.compareAt) return `<span class="card__badge card__badge--sale">−${Math.round((1 - p.price / p.compareAt) * 100)}%</span>`;
  if (p.tags.includes('nouveau')) return '<span class="card__badge">Nouveau</span>';
  if (p.tags.includes('best-seller')) return '<span class="card__badge">Best-seller</span>';
  return '';
}

export function priceTag(price, compareAt) {
  return `<p class="price"><span>${money(price)}</span>${compareAt ? `<s>${money(compareAt)}</s>` : ''}</p>`;
}

export function productCard(p, { categoryLabel, wished, index = 0, compact = false } = {}) {
  const needsOptions = p.variants.length > 0;
  return `
  <article class="card" style="--i:${index}">
    <a class="card__media" href="#/produit/${p.id}" data-product="${p.id}" aria-label="${esc(p.name)}">
      ${compact ? '' : badge(p)}
      <img src="${p.image}" alt="${esc(p.alt)}" loading="lazy" width="900" height="1125" class="is-loading" />
    </a>
    ${compact ? '' : `
    <button class="card__wish" type="button" aria-pressed="${wished}" aria-label="Ajouter ${esc(p.name)} aux favoris" data-wish="${p.id}">${heart}</button>
    <button class="card__quick" type="button" data-${needsOptions ? 'product' : 'quick-add'}="${p.id}">
      ${needsOptions ? 'Choisir une option' : 'Ajouter au panier'}
    </button>`}
    <div class="card__info">
      ${compact ? '' : `<p class="card__cat">${esc(categoryLabel)}</p>`}
      <h3 class="card__name"><a href="#/produit/${p.id}" data-product="${p.id}">${esc(p.name)}</a></h3>
      ${priceTag(p.price, p.compareAt)}
    </div>
  </article>`;
}

export function categoryTile(c, count) {
  return `
  <a class="cat reveal" href="#/collections/${c.id}">
    <span class="cat__frame">
      <img src="${c.image}" alt="" loading="lazy" />
      <span class="cat__count">${String(count).padStart(2, '0')} pièces</span>
    </span>
    <span class="cat__label">${esc(c.label)}</span>
    <span class="cat__blurb">${esc(c.blurb)}</span>
  </a>`;
}

export function cartLine(line) {
  const variant = Object.values(line.selection).join(' · ');
  return `
  <div class="cart-line">
    <a class="cart-line__img" href="#/produit/${line.product.id}" data-product="${line.product.id}">
      <img src="${line.product.image}" alt="${esc(line.product.alt)}" loading="lazy" />
    </a>
    <div>
      <p class="cart-line__name">${esc(line.product.name)}</p>
      ${variant ? `<p class="cart-line__variant">${esc(variant)}</p>` : ''}
      <div class="qty" role="group" aria-label="Quantité">
        <button type="button" aria-label="Diminuer la quantité" data-qty="${esc(line.key)}" data-delta="-1">−</button>
        <span>${line.qty}</span>
        <button type="button" aria-label="Augmenter la quantité" data-qty="${esc(line.key)}" data-delta="1">+</button>
      </div>
    </div>
    <div class="cart-line__right">
      <span>${money(line.unit * line.qty)}</span>
      <button class="cart-line__remove" type="button" data-remove="${esc(line.key)}">Retirer</button>
    </div>
  </div>`;
}

export function checkoutLine(line) {
  const variant = Object.entries(line.selection).map(([k, v]) => `${k} : ${v}`).join(' · ');
  return `
  <li class="co-line">
    <span class="co-line__img">
      <img src="${line.product.image}" alt="${esc(line.product.alt)}" loading="lazy" />
      <span class="co-line__qty" aria-label="Quantité ${line.qty}">${line.qty}</span>
    </span>
    <span class="co-line__info">
      <span class="co-line__name">${esc(line.product.name)}</span>
      ${variant ? `<span class="co-line__meta">${esc(variant)}</span>` : ''}
      <span class="co-line__meta">${line.qty} × ${money(line.unit)}</span>
    </span>
    <span class="co-line__total">${money(line.unit * line.qty)}</span>
  </li>`;
}

export function emptyCart() {
  return `
  <div class="cart__empty">
    <span class="wordmark wordmark--sm">RAWANE</span>
    <p>Votre panier est vide.</p>
    <span>Laissez-vous tenter par nos pièces signature.</span>
    <a class="btn btn--outline" href="#collection" data-close>Découvrir la collection ${arrow}</a>
  </div>`;
}

export function productView(p, { categoryLabel, wished, selection }) {
  const groups = p.variants
    .map(
      (g) => `
    <fieldset class="pv__opt">
      <legend>${esc(g.name)} : <strong data-sel-label="${esc(g.name)}">${esc(selection[g.name] || '')}</strong></legend>
      <div class="swatches" role="radiogroup" aria-label="${esc(g.name)}">
        ${g.options
          .map(
            (o) => `<button class="swatch" type="button" role="radio" aria-checked="${selection[g.name] === o.label}"
              data-group="${esc(g.name)}" data-option="${esc(o.label)}" ${o.soldOut ? 'disabled aria-disabled="true" title="Épuisé"' : ''}>${esc(o.label)}</button>`,
          )
          .join('')}
      </div>
    </fieldset>`,
    )
    .join('');

  const specs = p.materials
    ? `<dl class="pv__specs"><dt>Composition</dt><dd>${esc(p.materials)}</dd></dl>`
    : '';

  return `
    <button class="icon-btn pv__close" type="button" aria-label="Fermer" data-close>${close}</button>
    <div class="pv__media"><img src="${p.image}" alt="${esc(p.alt)}" /></div>
    <div class="pv__body">
      <p class="eyebrow">${esc(categoryLabel)}</p>
      <h2 class="pv__title" id="pv-title">${esc(p.name)}</h2>
      <div class="pv__price" data-pv-price>${priceTag(p.price, p.compareAt)}</div>
      <p class="pv__desc">${esc(p.description)}</p>
      ${groups}
      ${specs}
      <div class="pv__actions">
        <button class="btn btn--teal" type="button" data-pv-add="${p.id}">Ajouter au panier ${arrow}</button>
        <button class="pv__wish" type="button" aria-pressed="${wished}" aria-label="Ajouter aux favoris" data-wish="${p.id}">${heart}</button>
      </div>
      <ul class="pv__perks">
        <li>Livré dans son écrin RAWANE</li>
        <li>Retours faciles sous 14 jours</li>
        <li>Paiement sécurisé</li>
      </ul>
    </div>`;
}
