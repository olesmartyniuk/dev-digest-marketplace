// DOM builders. Index content is untrusted: it only ever reaches the page as text nodes
// or attribute values, never through innerHTML.
import { highlight, compareDefault } from './search.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const ICONS = {
  copy: [['rect', { x: 9, y: 9, width: 11, height: 11, rx: 2 }], ['path', { d: 'M5 15V5a2 2 0 0 1 2-2h10' }]],
  search: [['circle', { cx: 11, cy: 11, r: 7 }], ['path', { d: 'm20 20-4-4' }]],
  close: [['path', { d: 'M18 6 6 18M6 6l12 12' }]],
  back: [['path', { d: 'M19 12H5M12 5l-7 7 7 7' }]],
  external: [
    ['path', { d: 'M14 4h6v6' }], ['path', { d: 'M20 4 10 14' }],
    ['path', { d: 'M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5' }],
  ],
};
const TYPE_LABEL = { plugin: 'Plugin', skill: 'Skill', agent: 'Agent' };
const PLACEHOLDER_REPO = '<org>/dev-digest-marketplace';

export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value == null || value === false) continue;
    if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2), value);
    else if (key === 'class') el.className = value;
    else el.setAttribute(key, value === true ? '' : value);
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const child of children.flat(Infinity)) {
    if (child == null || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
}

export function icon(name, size = 16) {
  const svg = svgEl('svg', {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
    'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true',
  });
  for (const [tag, attrs] of ICONS[name]) svg.append(svgEl(tag, attrs));
  return svg;
}

function svgEl(tag, attrs) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

// ---- URLs and commands -------------------------------------------------------------------

const validRepo = (repo) => (typeof repo === 'string' && /^[\w.-]+\/[\w.-]+$/.test(repo) ? repo : null);
export const repoUrl = (ctx) => (validRepo(ctx.repo) ? `https://github.com/${ctx.repo}` : null);
export const marketplaceCommand = (ctx) => `claude plugin marketplace add ${validRepo(ctx.repo) ?? PLACEHOLDER_REPO}`;

export function routeHash(item) {
  const seg = encodeURIComponent;
  return item.type === 'plugin' ? `#/plugin/${seg(item.name)}` : `#/${item.type}/${seg(item.plugin)}/${seg(item.name)}`;
}

export function requestUrl(ctx, query = '') {
  const base = repoUrl(ctx);
  if (!base) return null;
  const q = query.trim();
  const params = [`template=skill-request.yml`, `title=${encodeURIComponent(q ? `Skill request: ${q}` : 'Skill request')}`];
  if (q) params.push(`need=${encodeURIComponent(q)}`);
  return `${base}/issues/new?${params.join('&')}`;
}

// ---- copy ---------------------------------------------------------------------------------

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = h('textarea', { 'aria-hidden': 'true', style: 'position:fixed;left:-9999px' });
    area.value = text;
    document.body.append(area);
    area.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { /* ignore */ }
    area.remove();
    return ok;
  }
}

export function copyButton(text, { label = 'Copy', primary = false, hiddenSuffix = '' } = {}) {
  const caption = h('span', {}, label);
  const button = h('button', { type: 'button', class: primary ? 'b pr' : 'b', 'aria-live': 'polite' },
    icon('copy'), caption, hiddenSuffix && h('span', { class: 'sr' }, ` ${hiddenSuffix}`));
  let timer;
  button.addEventListener('click', async () => {
    caption.textContent = (await copyText(text)) ? 'Copied' : 'Copy failed';
    clearTimeout(timer);
    timer = setTimeout(() => { caption.textContent = label; }, 2000);
  });
  return button;
}

// ---- pieces -------------------------------------------------------------------------------

export function highlighted(text, terms) {
  return highlight(text, terms).map((s) => (s.match ? h('mark', {}, s.text) : s.text));
}

function pluginCounts(items, plugin) {
  const own = items.filter((i) => i.plugin === plugin && i.type !== 'plugin');
  const parts = [];
  for (const type of ['skill', 'agent']) {
    const n = own.filter((i) => i.type === type).length;
    if (n) parts.push(`${n} ${type}${n > 1 ? 's' : ''}`);
  }
  return parts.join(' · ');
}

export function metaLine(item, items) {
  const version = item.version ? `v${item.version}` : '';
  const lead = item.type === 'plugin' ? pluginCounts(items, item.name) : item.plugin;
  return [lead, version].filter(Boolean).join(' · ');
}

function toolTags(tools, limit = Infinity) {
  if (!tools.length) return null;
  const shown = tools.length > limit ? [...tools.slice(0, limit), `+${tools.length - limit}`] : tools;
  return h('div', { class: 'tags' }, shown.map((t) => h('span', { class: 'tag' }, t)));
}

export function card(item, terms, ctx) {
  return h('article', { class: 'card' },
    h('span', { class: 'badge' }, TYPE_LABEL[item.type]),
    h('h3', { class: 'm nm' }, highlighted(item.name, terms)),
    h('p', { class: 'ds' }, highlighted(item.description, terms)),
    h('div', { class: 'mt m' }, metaLine(item, ctx.items)),
    toolTags(item.tools, 4),
    h('div', { class: 'actions' },
      copyButton(item.installCommand, { label: 'Copy install command', primary: true, hiddenSuffix: `for ${item.name}` }),
      h('a', { class: 'b', href: routeHash(item), 'aria-label': `View details for ${item.name}` }, 'View details')));
}

export function summaryText(query, count, partial) {
  const q = query.trim();
  if (!q) return `${count} ${count === 1 ? 'item' : 'items'}`;
  if (count === 0) return `No results for “${q}”`;
  if (partial) return `No exact match, showing partial matches (${count})`;
  return `${count} ${count === 1 ? 'result' : 'results'} for “${q}”`;
}

export function resultsView(found, query, ctx, handlers) {
  const { results, terms } = found;
  if (!results.length) return emptyState(query, ctx, handlers);

  const groups = [];
  if (terms.length) {
    groups.push({ heading: '', items: results });
  } else {
    for (const item of [...results].sort(compareDefault)) {
      const last = groups[groups.length - 1];
      if (last && last.heading === item.plugin) last.items.push(item);
      else groups.push({ heading: item.plugin, items: [item] });
    }
  }
  return h('div', {}, groups.map((g) => [
    g.heading && h('h2', { class: 'm group' }, g.heading),
    h('div', { class: 'grid' }, g.items.map((item) => card(item, terms, ctx))),
  ]));
}

export function emptyState(query, ctx, { onReset }) {
  const q = query.trim();
  const req = requestUrl(ctx, q);
  return h('div', { class: 'panel' },
    h('h3', {}, q ? `Nothing matched “${q}”` : 'Nothing to show'),
    h('p', {}, 'Try fewer words, drop type words like “skill”, or browse everything.'),
    h('div', { class: 'row' },
      h('button', { type: 'button', class: 'b', onclick: onReset }, 'Browse all'),
      req && h('a', { class: 'b pr', href: req, target: '_blank', rel: 'noopener' }, 'Request a new skill')));
}

export function loadingView() {
  return h('div', { class: 'grid', role: 'status', 'aria-label': 'Loading catalog' },
    [30, 60, 90].map((w) => h('div', { class: 'panel', style: 'margin-top:0' },
      h('div', { class: 'skel', style: `width:${w}%` }), h('div', { class: 'skel' }), h('div', { class: 'skel', style: 'width:80%' }))));
}

export function errorView({ onRetry }) {
  return h('div', { class: 'panel', role: 'alert' },
    h('h2', {}, 'We couldn’t load the catalog.'),
    h('p', {}, 'Check your connection and try again.'),
    h('button', { type: 'button', class: 'b pr', onclick: onRetry }, 'Retry'));
}

export function notFoundView(homeHref, onHome) {
  return h('div', { class: 'panel' },
    h('h2', {}, 'We couldn’t find that item'),
    h('p', {}, 'It may have been renamed or removed.'),
    h('a', { class: 'b pr', href: homeHref, onclick: onHome }, 'Back to the catalog'));
}

// ---- detail -------------------------------------------------------------------------------

export function detailView(item, ctx, { onBack }) {
  const base = repoUrl(ctx);
  const sourceUrl = base && `${base}/blob/main/${item.path.split('/').map(encodeURIComponent).join('/')}`;
  const children = ctx.items.filter((i) => i.plugin === item.plugin && i.type !== 'plugin').sort(compareDefault);

  return h('div', { class: 'detail' },
    h('button', { type: 'button', class: 'b link', onclick: onBack }, icon('back'), 'Back to results'),
    h('div', {}, h('span', { class: 'badge', style: 'display:inline-block;margin-top:8px' }, TYPE_LABEL[item.type])),
    h('h2', { class: 'title', tabindex: '-1', id: 'detail-title' }, item.name),
    h('div', { class: 'mt m', style: 'font-size:14px' }, metaLine(item, ctx.items)),
    item.tools.length ? h('div', { style: 'margin-top:12px' }, toolTags(item.tools)) : null,
    h('p', { style: 'margin-top:16px' }, item.description),

    h('h3', {}, 'Install'),
    h('p', { class: 'step' }, '1. Add the marketplace'),
    commandBox(marketplaceCommand(ctx)),
    h('p', { class: 'step', style: 'margin-top:16px' }, '2. Install the plugin'),
    commandBox(item.installCommand),
    h('p', { class: 'note' }, 'Skills and agents are installed through their plugin.'),

    h('h3', {}, 'Source preview'),
    h('pre', { class: 'src', tabindex: '0', 'aria-label': `Source of ${item.name}` }, item.source),
    sourceUrl && h('p', {}, h('a', { class: 'b link', href: sourceUrl, target: '_blank', rel: 'noopener' }, 'View on GitHub', icon('external'))),

    item.type === 'plugin' && children.length ? [
      h('h3', {}, 'Contents'),
      h('div', { class: 'kids' }, children.map((k) =>
        h('a', { class: 'b', href: routeHash(k) }, h('span', { class: 'm' }, k.name), h('span', { class: 'mt' }, TYPE_LABEL[k.type])))),
    ] : null);
}

function commandBox(command) {
  return h('div', { class: 'cb m' }, h('span', {}, command), copyButton(command));
}

// ---- chrome -------------------------------------------------------------------------------

export function installHint(ctx) {
  const command = marketplaceCommand(ctx);
  return h('div', { class: 'ins m' }, h('span', {}, command), copyButton(command));
}

export function footer(ctx) {
  const base = repoUrl(ctx);
  const req = requestUrl(ctx);
  const date = typeof ctx.generatedAt === 'string' ? ctx.generatedAt.slice(0, 10) : '';
  return [
    h('span', {}, 'Maintained by Oleksandr Martyniuk'),
    req && h('a', { href: req, target: '_blank', rel: 'noopener' }, 'Request a new skill'),
    base && h('a', { href: `${base}#readme`, target: '_blank', rel: 'noopener' }, 'Contribute'),
    base && h('a', { href: base, target: '_blank', rel: 'noopener' }, 'View repository'),
    date && h('span', {}, `Index updated ${date}`),
  ];
}
