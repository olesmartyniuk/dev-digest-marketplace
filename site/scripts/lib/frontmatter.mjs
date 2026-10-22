// Minimal YAML-frontmatter reader: flat `key: value` pairs, quoted strings,
// block scalars (| and >), block lists and inline lists. Nested maps are ignored.

const FENCE = /^---\n(?:([\s\S]*?)\n)?---[ \t]*(?:\n|$)/;
const KEY = /^([A-Za-z0-9_-]+):[ \t]*(.*)$/;

export function parseFrontmatter(text) {
  const src = String(text).replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const match = src.match(FENCE);
  if (!match) return { data: {}, body: src };

  const lines = (match[1] ?? '').split('\n');
  const data = {};
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(KEY);
    if (!m) continue;
    const [, key, raw] = m;
    const value = raw.trim();

    if (/^[|>][+-]?$/.test(value)) {
      const block = takeIndented(lines, i + 1);
      i += block.length;
      data[key] = value[0] === '|' ? dedent(block).join('\n').trim() : block.join(' ').replace(/\s+/g, ' ').trim();
    } else if (value === '') {
      const block = takeIndented(lines, i + 1);
      i += block.length;
      const items = block.map((l) => l.match(/^\s*-\s+(.*)$/)).filter(Boolean).map((m2) => unquote(m2[1].trim()));
      data[key] = items.length ? items : block.map((l) => l.trim()).filter(Boolean).join(' ');
    } else if (value.startsWith('[') && value.endsWith(']')) {
      data[key] = value.slice(1, -1).split(',').map((s) => unquote(s.trim())).filter(Boolean);
    } else {
      data[key] = unquote(value);
    }
  }
  return { data, body: src.slice(match[0].length) };
}

// Frontmatter values such as `tools: Read, Grep` can be a string or a list.
export function toList(value) {
  if (Array.isArray(value)) return value.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
}

function takeIndented(lines, from) {
  const out = [];
  for (let j = from; j < lines.length; j++) {
    if (lines[j] === '' || /^[ \t]/.test(lines[j])) out.push(lines[j]);
    else break;
  }
  return out;
}

function dedent(block) {
  const indents = block.filter((l) => l.trim()).map((l) => l.match(/^[ \t]*/)[0].length);
  const strip = indents.length ? Math.min(...indents) : 0;
  return block.map((l) => l.slice(strip));
}

function unquote(s) {
  if (s.length >= 2 && s.startsWith('"') && s.endsWith('"')) {
    return s.slice(1, -1).replace(/\\(["\\n])/g, (_, c) => (c === 'n' ? '\n' : c));
  }
  if (s.length >= 2 && s.startsWith("'") && s.endsWith("'")) return s.slice(1, -1).replace(/''/g, "'");
  return s;
}
