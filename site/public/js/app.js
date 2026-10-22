import { search } from './search.js';
import {
  h, icon, installHint, footer, loadingView, errorView, notFoundView, detailView, resultsView, summaryText,
} from './render.js';

const SITE_TITLE = 'Dev Digest Marketplace';
const TYPES = ['all', 'plugin', 'skill', 'agent'];
const CHIPS = [['all', 'All'], ['plugin', 'Plugins'], ['skill', 'Skills'], ['agent', 'Agents']];

const app = document.getElementById('app');
let ctx = null; // the loaded index
let state = readQuery();
let home = null; // handles of the mounted home view

// ---- URL state ----------------------------------------------------------------------------

function readQuery() {
  const p = new URLSearchParams(location.search);
  const type = p.get('type');
  return { q: p.get('q') ?? '', type: TYPES.includes(type) ? type : 'auto', plugin: p.get('plugin') ?? 'all' };
}

function homeUrl() {
  const p = new URLSearchParams();
  if (state.q) p.set('q', state.q);
  if (state.type !== 'auto') p.set('type', state.type);
  if (state.plugin !== 'all') p.set('plugin', state.plugin);
  const qs = p.toString();
  return location.pathname + (qs ? `?${qs}` : '');
}

function parseRoute() {
  const m = location.hash.match(/^#\/(plugin|skill|agent)\/(.+)$/);
  if (!m) return null;
  try {
    const segs = m[2].split('/').map(decodeURIComponent);
    return m[1] === 'plugin' ? { type: 'plugin', plugin: segs[0], name: segs[0] } : { type: m[1], plugin: segs[0], name: segs[1] };
  } catch {
    return { type: m[1], plugin: '', name: '' };
  }
}

function goHome() {
  history.pushState(null, '', homeUrl());
  route();
}

// ---- loading ------------------------------------------------------------------------------

async function load() {
  app.replaceChildren(loadingView());
  try {
    const res = await fetch('search-index.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.items)) throw new Error('Malformed index');
    ctx = data;
  } catch {
    app.replaceChildren(errorView({ onRetry: load }));
    return;
  }
  if (state.plugin !== 'all' && !ctx.items.some((i) => i.type === 'plugin' && i.name === state.plugin)) state.plugin = 'all';
  document.getElementById('install-hint').replaceChildren(installHint(ctx));
  document.getElementById('footer').replaceChildren(...footer(ctx).filter(Boolean));
  route();
}

// ---- routing ------------------------------------------------------------------------------

function route() {
  if (!ctx) return;
  const target = parseRoute();
  if (target) showDetail(target);
  else showHome();
}

function showDetail({ type, plugin, name }) {
  home = null;
  const item = ctx.items.find((i) => i.type === type && i.plugin === plugin && i.name === name);
  if (!item) {
    document.title = `Not found · ${SITE_TITLE}`;
    app.replaceChildren(notFoundView(homeUrl(), (e) => { e.preventDefault(); goHome(); }));
  } else {
    document.title = `${item.name} · ${SITE_TITLE}`;
    app.replaceChildren(detailView(item, ctx, { onBack: goHome }));
  }
  window.scrollTo(0, 0);
  (document.getElementById('detail-title') ?? app).focus({ preventScroll: true });
}

function showHome() {
  document.title = SITE_TITLE;
  if (!home || !app.contains(home.root)) {
    home = mountHome();
    app.replaceChildren(home.root);
  }
  updateHome();
}

// ---- home view ----------------------------------------------------------------------------

function mountHome() {
  let timer;
  const input = h('input', {
    id: 'q', type: 'text', autocomplete: 'off', spellcheck: 'false', enterkeyhint: 'search',
    placeholder: matchMedia('(max-width: 640px)').matches ? 'Search, e.g. code review skill' : 'Describe what you need, e.g. code review skill',
    oninput: () => { clearTimeout(timer); timer = setTimeout(() => setQuery(input.value, false), 100); },
    onkeydown: (e) => { if (e.key === 'Escape' && input.value) { e.preventDefault(); setQuery('', true); } },
  });
  const kbd = h('kbd', { 'aria-hidden': 'true', title: 'Press / to search' }, '/');
  const clear = h('button', { type: 'button', class: 'x', 'aria-label': 'Clear search', onclick: () => setQuery('', true) }, icon('close'));
  const bar = h('div', { class: 'srch', role: 'search' },
    icon('search', 20), h('label', { for: 'q', class: 'sr' }, 'Search the catalog'), input, kbd, clear);

  const chips = CHIPS.map(([type, label]) => ({
    type, label,
    el: h('button', { type: 'button', class: 'chip', 'aria-pressed': 'false', onclick: () => { state.type = type; updateHome(); } }),
  }));
  const plugins = ctx.items.filter((i) => i.type === 'plugin').map((i) => i.name);
  const select = h('select', { class: 'sel', 'aria-label': 'Filter by plugin', onchange: () => { state.plugin = select.value; updateHome(); } },
    h('option', { value: 'all' }, 'All plugins'), plugins.map((p) => h('option', { value: p }, p)));

  const summary = h('p', { class: 'summary', role: 'status', 'aria-live': 'polite' });
  const results = h('div');
  const root = h('div', {}, bar, h('div', { class: 'chips' }, chips.map((c) => c.el), select), summary, results);
  return { root, input, kbd, clear, chips, select, summary, results };
}

function setQuery(value, syncInput) {
  state.q = value;
  if (syncInput) home.input.value = value;
  updateHome();
  if (syncInput) home.input.focus();
}

function updateHome() {
  if (!home) return;
  const found = search(ctx.items, state.q, { type: state.type, plugin: state.plugin });
  for (const chip of home.chips) {
    chip.el.textContent = `${chip.label} ${found.counts[chip.type]}`;
    chip.el.setAttribute('aria-pressed', String(found.effectiveType === chip.type));
  }
  home.clear.hidden = !state.q;
  home.kbd.hidden = !!state.q;
  home.select.value = state.plugin;
  if (document.activeElement !== home.input) home.input.value = state.q;
  home.summary.textContent = summaryText(state.q, found.results.length, found.partial);
  home.results.replaceChildren(resultsView(found, state.q, ctx, { onReset: () => {
    state = { q: '', type: 'all', plugin: 'all' };
    home.input.value = '';
    updateHome();
  } }));
  history.replaceState(null, '', homeUrl() + location.hash);
}

// ---- global events ------------------------------------------------------------------------

window.addEventListener('popstate', () => {
  state = readQuery();
  if (ctx && state.plugin !== 'all' && !ctx.items.some((i) => i.type === 'plugin' && i.name === state.plugin)) state.plugin = 'all';
  route();
});

document.addEventListener('keydown', (e) => {
  if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey || !home) return;
  const t = e.target;
  if (t instanceof HTMLElement && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))) return;
  e.preventDefault();
  home.input.focus();
});

load();
