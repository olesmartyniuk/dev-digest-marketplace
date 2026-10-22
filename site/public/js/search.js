// Pure search over the catalog index. No DOM access, so it runs in the browser and in node:test.

export const TYPE_ORDER = { plugin: 0, skill: 1, agent: 2 };
const WEIGHTS = { name: 5, description: 3, plugin: 2, body: 1 };
const FIELDS = Object.keys(WEIGHTS);

const TYPE_WORDS = {
  skill: 'skill', skills: 'skill',
  agent: 'agent', agents: 'agent',
  plugin: 'plugin', plugins: 'plugin',
};

const STOPWORDS = new Set([
  'i', 'me', 'my', 'we', 'you', 'need', 'needs', 'want', 'wants', 'looking', 'find', 'show', 'get', 'give',
  'a', 'an', 'the', 'and', 'or', 'for', 'to', 'of', 'in', 'on', 'with', 'that', 'this', 'it', 'is', 'are',
  'be', 'can', 'could', 'should', 'would', 'some', 'any', 'something', 'do', 'does', 'how', 'what', 'which',
  'please', 'help', 'using', 'use', 'like',
]);

export const words = (text) => String(text ?? '').toLowerCase().match(/[a-z0-9]+/g) ?? [];

export function parseQuery(query) {
  const hints = new Set();
  const terms = [];
  for (const word of words(query)) {
    if (TYPE_WORDS[word]) hints.add(TYPE_WORDS[word]);
    else if (!STOPWORDS.has(word) && !terms.includes(word)) terms.push(word);
  }
  return { terms, typeHint: hints.size === 1 ? [...hints][0] : null };
}

// "reviews" should find "review"; matching is otherwise exact-or-prefix on whole words.
export const termVariants = (term) => (term.length > 3 && term.endsWith('s') ? [term, term.slice(0, -1)] : [term]);

const wordCache = new WeakMap();
function fieldWords(item) {
  let cached = wordCache.get(item);
  if (!cached) {
    cached = Object.fromEntries(FIELDS.map((f) => [f, words(item[f])]));
    wordCache.set(item, cached);
  }
  return cached;
}

function scoreItem(item, terms) {
  const fields = fieldWords(item);
  let score = 0;
  let matched = 0;
  for (const term of terms) {
    const variants = termVariants(term);
    let hit = false;
    for (const field of FIELDS) {
      if (fields[field].some((w) => variants.some((v) => w.startsWith(v)))) {
        score += WEIGHTS[field];
        hit = true;
      }
    }
    if (hit) matched++;
  }
  return { item, score, matched };
}

export const compareDefault = (a, b) =>
  cmp(a.plugin, b.plugin) || TYPE_ORDER[a.type] - TYPE_ORDER[b.type] || cmp(a.name, b.name);

function rank(pool, terms) {
  if (!terms.length) return { results: [...pool].sort(compareDefault), partial: false };
  const scored = pool.map((item) => scoreItem(item, terms));
  let hits = scored.filter((s) => s.matched === terms.length);
  let partial = false;
  if (!hits.length) {
    hits = scored.filter((s) => s.matched > 0);
    partial = hits.length > 0;
  }
  hits.sort((a, b) => b.matched - a.matched || b.score - a.score || compareDefault(a.item, b.item));
  return { results: hits.map((s) => s.item), partial };
}

// options.type: 'auto' (use the type word from the query, if any) | 'all' | 'plugin' | 'skill' | 'agent'
export function search(items, query, { type = 'auto', plugin = 'all' } = {}) {
  const { terms, typeHint } = parseQuery(query);
  const pool = plugin === 'all' ? items : items.filter((i) => i.plugin === plugin);
  const effectiveType = type === 'auto' ? typeHint ?? 'all' : type;

  const everything = rank(pool, terms);
  const counts = { all: everything.results.length, plugin: 0, skill: 0, agent: 0 };
  for (const item of everything.results) counts[item.type]++;

  const chosen = effectiveType === 'all' ? everything : rank(pool.filter((i) => i.type === effectiveType), terms);
  return { results: chosen.results, partial: chosen.partial, counts, terms, typeHint, effectiveType };
}

// Splits text into plain and matched segments for highlighting (matched = prefix of a word).
export function highlight(text, terms) {
  const value = String(text ?? '');
  const alternatives = [...new Set(terms.flatMap(termVariants))]
    .sort((a, b) => b.length - a.length)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!alternatives.length) return [{ text: value, match: false }];

  const re = new RegExp(`(?<![a-z0-9])(?:${alternatives.join('|')})`, 'gi');
  const segments = [];
  let last = 0;
  for (const m of value.matchAll(re)) {
    if (m.index > last) segments.push({ text: value.slice(last, m.index), match: false });
    segments.push({ text: m[0], match: true });
    last = m.index + m[0].length;
  }
  if (last < value.length) segments.push({ text: value.slice(last), match: false });
  return segments.length ? segments : [{ text: value, match: false }];
}

function cmp(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}
