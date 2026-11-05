import { products, categories, featuredCollection, shop } from './data/products.js';
import { createStore } from './store.js';
import { money, esc, productCard, categoryTile, cartLine, emptyCart, productView, priceTag } from './templates.js';
import { initCheckout } from './checkout.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const productsById = new Map(products.map((p) => [p.id, p]));
const categoriesById = new Map(categories.map((c) => [c.id, c]));
const store = createStore(productsById);

const catLabel = (p) => categoriesById.get(p.category)?.label ?? '';
const cardOpts = (p, index) => ({ categoryLabel: catLabel(p), wished: store.isWished(p.id), index });

const FALLBACK_IMG =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><rect width="400" height="500" fill="#f1e9dd"/><path d="M170 290v-60a30 30 0 0 1 60 0v60" fill="none" stroke="#c9a96e" stroke-width="2"/><text x="200" y="330" text-anchor="middle" font-family="Georgia,serif" font-size="22" letter-spacing="8" fill="#0f2b29">RAWANE</text></svg>',
  );

/* ------------------------------------------------------------------ */
/* Images: fade in on load, graceful fallback if a file is missing.    */
/* ------------------------------------------------------------------ */

function wireImages(root = document) {
  $$('img.is-loading', root).forEach((img) => {
    const done = () => img.classList.remove('is-loading');
    if (img.complete && img.naturalWidth) done();
    else {
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', () => { img.src = FALLBACK_IMG; done(); }, { once: true });
    }
  });
}
document.addEventListener('error', (e) => {
  const img = e.target;
  if (img instanceof HTMLImageElement && img.src !== FALLBACK_IMG) img.src = FALLBACK_IMG;
}, true);

/* ------------------------------------------------------------------ */
/* Static content rendered from data                                   */
/* ------------------------------------------------------------------ */

function renderNavigation() {
  const counts = Object.fromEntries(categories.map((c) => [c.id, products.filter((p) => p.category === c.id).length]));

  $('[data-mega-categories]').innerHTML =
    `<li><a href="#/boutique">Toutes les pièces</a></li>` +
    categories.map((c) => `<li><a href="#/collections/${c.id}">${esc(c.label)}</a></li>`).join('');
  $('[data-mega-cards]').innerHTML = categories
    .map((c) => `<a class="mega-card" href="#/collections/${c.id}"><span class="mega-card__img"><img src="${c.image}" alt="" loading="lazy" /></span><span>${esc(c.label)}</span></a>`)
    .join('');
  $('[data-mobile-categories]').innerHTML = categories
    .map((c) => `<a href="#/collections/${c.id}" data-close>${esc(c.label)}</a>`)
    .join('');
  $('[data-footer-categories]').innerHTML = categories
    .map((c) => `<li><a href="#/collections/${c.id}">${esc(c.label)}</a></li>`)
    .join('');
  $('[data-categories]').innerHTML = categories.map((c) => categoryTile(c, counts[c.id])).join('');
  $$('[data-free-threshold]').forEach((el) => (el.textContent = money(shop.freeShippingThreshold)));
}

/* ------------------------------------------------------------------ */
/* Featured carousel                                                   */
/* ------------------------------------------------------------------ */

function renderFeatured() {
  $('[data-featured-eyebrow]').textContent = featuredCollection.eyebrow;
  $('[data-featured-title]').innerHTML = esc(featuredCollection.title).replace('Lumière', '<em>Lumière</em>');
  $('[data-featured-sub]').textContent = featuredCollection.subtitle;

  const items = featuredCollection.productIds.map((id) => productsById.get(id)).filter(Boolean);
  const track = $('[data-track]');
  track.innerHTML = items.map((p, i) => productCard(p, cardOpts(p, i))).join('');
  wireImages(track);
}

function initCarousel() {
  const root = $('[data-carousel]');
  const track = $('[data-track]', root);
  const prev = $('[data-prev]', root);
  const next = $('[data-next]', root);
  const bar = $('[data-progress]');

  const step = () => {
    const card = track.firstElementChild;
    return card ? card.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0) : 0;
  };
  const update = () => {
    const max = track.scrollWidth - track.clientWidth;
    prev.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft >= max - 2;
    const visible = Math.min(1, track.clientWidth / track.scrollWidth);
    bar.style.width = `${visible * 100}%`;
    bar.style.transform = `translateX(${max > 0 ? (track.scrollLeft / max) * ((1 - visible) / visible) * 100 : 0}%)`;
  };

  prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
  next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
  track.addEventListener('scroll', update, { passive: true });
  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); next.click(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev.click(); }
  });
  window.addEventListener('resize', update);
  update();
}

/* ------------------------------------------------------------------ */
/* Shop grid: filters + sort                                           */
/* ------------------------------------------------------------------ */

const shopState = { category: 'all', sort: 'featured' };

function renderFilters() {
  const tabs = [{ id: 'all', label: 'Tout' }, ...categories];
  $('[data-filters]').innerHTML = tabs
    .map((t) => `<button class="tab" type="button" role="tab" aria-selected="${shopState.category === t.id}" data-filter="${t.id}">${esc(t.label)}</button>`)
    .join('');
}

function sortedProducts(list) {
  const out = [...list];
  switch (shopState.sort) {
    case 'price-asc': return out.sort((a, b) => a.price - b.price);
    case 'price-desc': return out.sort((a, b) => b.price - a.price);
    case 'new': return out.sort((a, b) => Number(b.tags.includes('nouveau')) - Number(a.tags.includes('nouveau')));
    default: return out;
  }
}

function renderGrid() {
  const list = sortedProducts(shopState.category === 'all' ? products : products.filter((p) => p.category === shopState.category));
  const grid = $('[data-grid]');
  grid.innerHTML = list.length
    ? list.map((p, i) => productCard(p, cardOpts(p, i))).join('')
    : '<p class="empty">Aucune pièce dans cette catégorie pour le moment.</p>';
  wireImages(grid);

  const cat = categoriesById.get(shopState.category);
  $('[data-shop-title]').innerHTML = cat ? `Nos <em>${esc(cat.label.toLowerCase())}</em>` : 'Toutes nos <em>pièces</em>';
  $('[data-shop-count]').textContent = `${list.length} pièce${list.length > 1 ? 's' : ''}`;
  $$('[data-filter]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.filter === shopState.category)));
}

function setCategory(id, { scroll = false } = {}) {
  shopState.category = categoriesById.has(id) ? id : 'all';
  renderGrid();
  if (scroll) $('#boutique').scrollIntoView({ behavior: 'smooth' });
}

function initShop() {
  renderFilters();
  renderGrid();
  $('[data-filters]').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-filter]');
    if (!btn) return;
    setCategory(btn.dataset.filter);
    const hash = btn.dataset.filter === 'all' ? '#/boutique' : `#/collections/${btn.dataset.filter}`;
    history.replaceState(null, '', hash);
  });
  $('[data-sort]').addEventListener('change', (e) => {
    shopState.sort = e.target.value;
    renderGrid();
  });
}

/* ------------------------------------------------------------------ */
/* Overlays (menu, cart, search, product) with focus management        */
/* ------------------------------------------------------------------ */

let activeOverlay = null;
let lastFocus = null;

function openOverlay(el) {
  if (activeOverlay && activeOverlay !== el) closeOverlay({ restoreFocus: false });
  lastFocus = lastFocus || document.activeElement;
  activeOverlay = el;
  el.classList.add('is-open');
  el.setAttribute('aria-hidden', 'false');
  document.body.classList.add('is-locked');
  requestAnimationFrame(() => {
    const target = $('[data-search-input]', el) || $('button, [href], input, select', $('[role="dialog"]', el) || el);
    target?.focus({ preventScroll: true });
  });
}

function closeOverlay({ restoreFocus = true } = {}) {
  const el = activeOverlay;
  if (!el || el.dataset.busy === 'true') return; // never close the checkout while an order is being saved
  el.classList.remove('is-open');
  el.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('is-locked');
  activeOverlay = null;
  $('[data-open-menu]').setAttribute('aria-expanded', 'false');
  if (el.matches('[data-modal]') && location.hash.startsWith('#/produit/')) {
    history.replaceState(null, '', location.pathname + location.search);
  }
  if (restoreFocus && lastFocus?.isConnected) lastFocus.focus({ preventScroll: true });
  lastFocus = null;
}

function trapFocus(e) {
  if (!activeOverlay || e.key !== 'Tab') return;
  const focusables = $$('button:not([disabled]), [href], input:not([disabled]), select, textarea:not([disabled])', activeOverlay).filter((n) => n.offsetParent !== null);
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

function initOverlays() {
  const menu = $('[data-drawer="menu"]');
  const cart = $('[data-drawer="cart"]');
  const search = $('[data-search]');

  $('[data-open-menu]').addEventListener('click', (e) => {
    e.currentTarget.setAttribute('aria-expanded', 'true');
    openOverlay(menu);
  });
  $('[data-open-cart]').addEventListener('click', () => openOverlay(cart));
  $('[data-open-search]').addEventListener('click', () => openOverlay(search));

  document.addEventListener('click', (e) => {
    const closer = e.target.closest('[data-close]');
    if (closer && activeOverlay?.contains(closer)) closeOverlay({ restoreFocus: !closer.matches('a') });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeOverlay(); closeMega(); }
    trapFocus(e);
  });
}

/* ------------------------------------------------------------------ */
/* Mega menu                                                           */
/* ------------------------------------------------------------------ */

const megaToggle = $('[data-mega-toggle]');
const mega = $('[data-mega]');
function closeMega() {
  mega.classList.remove('is-open');
  megaToggle.setAttribute('aria-expanded', 'false');
}
function initMega() {
  const item = megaToggle.parentElement;
  let timer;
  const open = () => { clearTimeout(timer); mega.classList.add('is-open'); megaToggle.setAttribute('aria-expanded', 'true'); };
  megaToggle.addEventListener('click', () => (mega.classList.contains('is-open') ? closeMega() : open()));
  item.addEventListener('mouseenter', open);
  item.addEventListener('mouseleave', () => { timer = setTimeout(closeMega, 180); });
  mega.addEventListener('click', (e) => { if (e.target.closest('a')) closeMega(); });
  item.addEventListener('focusout', (e) => { if (!item.contains(e.relatedTarget)) closeMega(); });
}

/* ------------------------------------------------------------------ */
/* Cart                                                                */
/* ------------------------------------------------------------------ */

function renderCart() {
  const count = store.count;
  const badge = $('[data-cart-count]');
  badge.textContent = count;
  badge.classList.toggle('has-items', count > 0);
  $('[data-open-cart]').setAttribute('aria-label', `Ouvrir le panier (${count} article${count > 1 ? 's' : ''})`);
  $('[data-cart-count-label]').textContent = count ? `(${count})` : '';

  const lines = store.lines;
  const items = $('[data-cart-items]');
  items.innerHTML = lines.length ? lines.map(cartLine).join('') : emptyCart();
  $('[data-cart-foot]').hidden = !lines.length;
  $('[data-ship-meter]').hidden = !lines.length;
  $('[data-cart-subtotal]').textContent = money(store.subtotal);

  const remaining = shop.freeShippingThreshold - store.subtotal;
  $('[data-ship-text]').innerHTML = remaining > 0
    ? `Plus que <strong>${money(remaining)}</strong> pour profiter de la livraison offerte.`
    : '<strong>Félicitations</strong>, la livraison vous est offerte.';
  $('[data-ship-bar]').style.width = `${Math.min(100, (store.subtotal / shop.freeShippingThreshold) * 100)}%`;
}

function bumpBag() {
  const btn = $('[data-open-cart]');
  btn.classList.remove('is-bump');
  void btn.offsetWidth;
  btn.classList.add('is-bump');
}

function initCart() {
  renderCart();
  store.subscribe((change) => {
    renderCart();
    if (change.type === 'add') bumpBag();
    if (change.type === 'wish') {
      $$(`[data-wish="${change.productId}"]`).forEach((b) => b.setAttribute('aria-pressed', String(change.wished)));
    }
  });

  $('[data-cart-items]').addEventListener('click', (e) => {
    const qtyBtn = e.target.closest('[data-qty]');
    if (qtyBtn) {
      const line = store.lines.find((l) => l.key === qtyBtn.dataset.qty);
      if (line) store.setQty(line.key, line.qty + Number(qtyBtn.dataset.delta));
      return;
    }
    const rm = e.target.closest('[data-remove]');
    if (rm) store.remove(rm.dataset.remove);
  });

  initCheckout({ store, openOverlay, cart: $('[data-drawer="cart"]') });
}

/* ------------------------------------------------------------------ */
/* Product quick view                                                  */
/* ------------------------------------------------------------------ */

function defaultSelection(p) {
  return Object.fromEntries(p.variants.map((g) => [g.name, (g.options.find((o) => !o.soldOut) || g.options[0]).label]));
}

function selectionPrice(p, selection) {
  return p.variants.reduce((sum, g) => sum + (g.options.find((o) => o.label === selection[g.name])?.priceDelta || 0), p.price);
}

function openProduct(id) {
  const p = productsById.get(id);
  if (!p) return;
  const modal = $('[data-modal]');
  const panel = $('[data-modal-panel]');
  const selection = defaultSelection(p);

  panel.innerHTML = productView(p, { categoryLabel: catLabel(p), wished: store.isWished(p.id), selection });
  panel.scrollTop = 0;

  panel.onclick = (e) => {
    const sw = e.target.closest('[data-option]');
    if (sw && !sw.disabled) {
      const group = sw.dataset.group;
      selection[group] = sw.dataset.option;
      $$(`[data-group="${CSS.escape(group)}"]`, panel).forEach((b) => b.setAttribute('aria-checked', String(b === sw)));
      $(`[data-sel-label="${CSS.escape(group)}"]`, panel).textContent = sw.dataset.option;
      const price = selectionPrice(p, selection);
      $('[data-pv-price]', panel).innerHTML = priceTag(price, p.compareAt && price === p.price ? p.compareAt : null);
      return;
    }
    if (e.target.closest('[data-pv-add]')) {
      store.add(p.id, { ...selection });
      closeOverlay({ restoreFocus: false });
      toast(`${p.name} a été ajouté à votre panier.`, { action: 'Voir le panier' });
    }
  };

  if (activeOverlay !== modal) openOverlay(modal);
}

/* ------------------------------------------------------------------ */
/* Search                                                              */
/* ------------------------------------------------------------------ */

const normalize = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const searchIndex = products.map((p) => ({
  p,
  text: normalize([p.name, catLabel(p), categoriesById.get(p.category)?.singular, p.description, ...p.tags].join(' ')),
}));

function renderSearch(query) {
  const out = $('[data-search-results]');
  const q = normalize(query.trim());
  if (!q) {
    out.innerHTML = `
      <span class="eyebrow">Suggestions</span>
      <div class="search__suggest">
        ${categories.map((c) => `<a class="chip" href="#/collections/${c.id}" data-close>${esc(c.label)}</a>`).join('')}
        <button class="chip" type="button" data-suggest="créoles">Créoles</button>
        <button class="chip" type="button" data-suggest="perle">Perle</button>
        <button class="chip" type="button" data-suggest="nouveau">Nouveautés</button>
      </div>`;
    return;
  }
  const terms = q.split(/\s+/);
  const hits = searchIndex.filter(({ text }) => terms.every((t) => text.includes(t))).map(({ p }) => p);
  out.innerHTML = hits.length
    ? `<span class="eyebrow">${hits.length} résultat${hits.length > 1 ? 's' : ''}</span>
       <div class="search__grid">${hits.map((p, i) => productCard(p, { ...cardOpts(p, i), compact: true })).join('')}</div>`
    : `<p class="search__empty">Aucun bijou ne correspond à « ${esc(query.trim())} ».</p>`;
  wireImages(out);
}

function initSearch() {
  const input = $('[data-search-input]');
  let t;
  input.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => renderSearch(input.value), 120); });
  $('[data-search-results]').addEventListener('click', (e) => {
    const s = e.target.closest('[data-suggest]');
    if (s) { input.value = s.dataset.suggest; renderSearch(input.value); input.focus(); }
  });
  renderSearch('');
}

/* ------------------------------------------------------------------ */
/* Global click delegation: product links, quick add, wishlist         */
/* ------------------------------------------------------------------ */

function initDelegation() {
  document.addEventListener('click', (e) => {
    const wish = e.target.closest('[data-wish]');
    if (wish) {
      e.preventDefault();
      const p = productsById.get(wish.dataset.wish);
      const on = store.toggleWish(p.id);
      toast(on ? `${p.name} ajouté à vos favoris.` : `${p.name} retiré de vos favoris.`);
      return;
    }
    const quick = e.target.closest('[data-quick-add]');
    if (quick) {
      const p = productsById.get(quick.dataset.quickAdd);
      store.add(p.id);
      toast(`${p.name} a été ajouté à votre panier.`, { action: 'Voir le panier' });
      return;
    }
    const prod = e.target.closest('[data-product]');
    if (prod) {
      e.preventDefault();
      if (activeOverlay && !activeOverlay.matches('[data-modal]')) closeOverlay({ restoreFocus: false });
      history.pushState(null, '', `#/produit/${prod.dataset.product}`);
      openProduct(prod.dataset.product);
      return;
    }
    // Re-clicking the current route fires no hashchange — run it anyway so the link still scrolls.
    const link = e.target.closest('a[href^="#/"]');
    if (link && link.getAttribute('href') === location.hash) route();
  });

  $('[data-account]').addEventListener('click', () => toast('Votre espace client arrive très bientôt.'));
}

/* ------------------------------------------------------------------ */
/* Routing (hash based, so the site works on any static host)          */
/* ------------------------------------------------------------------ */

function route() {
  const hash = location.hash;
  const [, section, id] = hash.match(/^#\/([^/]+)\/?([^/]*)/) || [];
  $$('.nav__link').forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#/boutique' && (section === 'boutique' || section === 'collections')));

  if (section === 'produit') return openProduct(id);
  if (activeOverlay?.matches('[data-modal]')) closeOverlay({ restoreFocus: false });
  if (section === 'boutique') return setCategory('all', { scroll: true });
  if (section === 'collections') return setCategory(id, { scroll: true });
  if (hash === '#/') window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ------------------------------------------------------------------ */
/* Small UI niceties                                                   */
/* ------------------------------------------------------------------ */

let toastTimer;
function toast(message, { action } = {}) {
  const el = $('[data-toast]');
  el.innerHTML = `<span>${esc(message)}</span>${action ? `<button class="link-underline link-underline--light" type="button" data-toast-action>${esc(action)}</button>` : ''}`;
  el.style.pointerEvents = action ? 'auto' : 'none';
  el.classList.add('is-show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.classList.remove('is-show'); el.style.pointerEvents = 'none'; }, 3600);
  $('[data-toast-action]', el)?.addEventListener('click', () => {
    el.classList.remove('is-show');
    openOverlay($('[data-drawer="cart"]'));
  });
}

function initNewsletter() {
  const form = $('[data-newsletter]');
  const msg = $('[data-newsletter-msg]');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = form.email.value.trim();
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
    msg.classList.toggle('is-error', !ok);
    msg.textContent = ok ? 'Merci ! Vous faites désormais partie de la maison RAWANE.' : 'Merci de saisir une adresse e-mail valide.';
    if (ok) form.reset();
  });
}

function initHeader() {
  const header = $('[data-header]');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

function initReveal() {
  // The hero is above the fold: animate it in right away instead of waiting on the observer.
  requestAnimationFrame(() => $$('.hero .reveal').forEach((el) => el.classList.add('is-in')));
  const els = $$('.reveal:not(.hero .reveal)');
  if (!('IntersectionObserver' in window)) return els.forEach((el) => el.classList.add('is-in'));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  els.forEach((el) => io.observe(el));
}

/* ------------------------------------------------------------------ */

renderNavigation();
renderFeatured();
initCarousel();
initShop();
initOverlays();
initMega();
initCart();
initSearch();
initDelegation();
initNewsletter();
initHeader();
initReveal();
wireImages();
window.addEventListener('hashchange', route);
window.addEventListener('popstate', () => { if (!location.hash.startsWith('#/produit/') && activeOverlay?.matches('[data-modal]')) closeOverlay({ restoreFocus: false }); });
if (location.hash.startsWith('#/')) route();
