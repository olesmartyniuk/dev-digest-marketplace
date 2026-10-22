import test from 'node:test';
import assert from 'node:assert/strict';
import { parseQuery, search, highlight } from '../public/js/search.js';

const mk = (type, plugin, name, description, extra = {}) => ({
  id: `${type}:${plugin}${type === 'plugin' ? '' : '/' + name}`,
  type, plugin, name, description, body: '', tools: [], version: '1.0.0', ...extra,
});

const items = [
  mk('plugin', 'review-tools', 'review-tools', 'Skills and a sub-agent for reviewing and testing changes.'),
  mk('plugin', 'workflow-kit', 'workflow-kit', 'Helpers for turning feedback into follow-up work.'),
  mk('skill', 'review-tools', 'code-review', 'Reviews a diff for correctness, readability and security.'),
  mk('skill', 'review-tools', 'security-review', 'Checks changes for injection, secrets and unsafe input handling.'),
  mk('skill', 'workflow-kit', 'review-comments', 'Turns reviewer comments into a checklist of code changes to make.'),
  mk('agent', 'review-tools', 'test-engineer', 'Designs test strategy and writes tests for existing code.', { tools: ['Read', 'Grep'] }),
  mk('skill', 'workflow-kit', 'notes', 'Keeps notes.', { body: 'Mentions refactoring in the body only.' }),
];

test('parseQuery drops stopwords and extracts the type word', () => {
  const q = parseQuery('I need a skill for code review');
  assert.deepEqual(q.terms, ['code', 'review']);
  assert.equal(q.typeHint, 'skill');
});

test('parseQuery: plural type words, mixed types give no hint, terms are deduped', () => {
  assert.equal(parseQuery('agents').typeHint, 'agent');
  assert.equal(parseQuery('plugins for review review').typeHint, 'plugin');
  assert.deepEqual(parseQuery('plugins for review review').terms, ['review']);
  assert.equal(parseQuery('skill or agent').typeHint, null);
  assert.deepEqual(parseQuery('   ').terms, []);
});

test('"I need a skill for code review" returns only skills, best name match first', () => {
  const r = search(items, 'I need a skill for code review');
  assert.equal(r.effectiveType, 'skill');
  assert.ok(r.results.every((i) => i.type === 'skill'));
  assert.equal(r.partial, false);
  // code-review: both terms in the name. review-comments: 'review' in name, 'code' in description.
  assert.deepEqual(r.results.map((i) => i.name), ['code-review', 'review-comments']);
});

test('a type word alone lists everything of that type', () => {
  assert.deepEqual(search(items, 'agent').results.map((i) => i.name), ['test-engineer']);
});

test('empty query returns everything, sorted by plugin, then type, then name', () => {
  const r = search(items, '');
  assert.equal(r.results.length, items.length);
  assert.deepEqual(r.results.slice(0, 4).map((i) => i.id), [
    'plugin:review-tools',
    'skill:review-tools/code-review',
    'skill:review-tools/security-review',
    'agent:review-tools/test-engineer',
  ]);
});

test('prefix and plural matching', () => {
  assert.ok(search(items, 'reviews').results.some((i) => i.name === 'code-review'));
  assert.ok(search(items, 'test').results.some((i) => i.name === 'test-engineer'));
  assert.ok(search(items, 'review').results.some((i) => i.name === 'review-comments'));
  assert.deepEqual(search(items, 'view').results, [], 'no mid-word matches');
});

test('body matches count', () => {
  assert.deepEqual(search(items, 'refactoring').results.map((i) => i.name), ['notes']);
});

test('field weights: name beats description beats plugin beats body', () => {
  const pool = [
    mk('skill', 'p', 'in-body', 'nothing', { body: 'zebra' }),
    mk('skill', 'zebra', 'in-plugin', 'nothing'),
    mk('skill', 'p', 'in-desc', 'a zebra here'),
    mk('skill', 'p', 'zebra', 'nothing'),
  ];
  assert.deepEqual(search(pool, 'zebra').results.map((i) => i.name), ['zebra', 'in-desc', 'in-plugin', 'in-body']);
});

test('falls back to ANY term and flags a partial match', () => {
  const r = search(items, 'security feedback');
  assert.equal(r.partial, true);
  // 'security' is in security-review (name) and code-review (description); 'feedback' only in workflow-kit.
  assert.deepEqual(new Set(r.results.map((i) => i.name)), new Set(['security-review', 'code-review', 'workflow-kit']));
  assert.equal(r.results[0].name, 'security-review', 'name match ranks first');
});

test('nonsense query: no results, not partial', () => {
  const r = search(items, 'zzzzqqq');
  assert.equal(r.results.length, 0);
  assert.equal(r.partial, false);
});

test('an explicit type overrides the hint; "all" disables the filter', () => {
  const agents = search(items, 'skill test', { type: 'agent' });
  assert.deepEqual(agents.results.map((i) => i.name), ['test-engineer']);
  const all = search(items, 'skill review', { type: 'all' });
  // every type matches 'review' (the agent through its plugin name), so none is filtered out
  assert.deepEqual(new Set(all.results.map((i) => i.type)), new Set(['plugin', 'skill', 'agent']));
  assert.ok(search(items, 'skill review').results.every((i) => i.type === 'skill'));
});

test('the plugin filter narrows the pool', () => {
  const r = search(items, 'review', { plugin: 'workflow-kit' });
  assert.ok(r.results.length > 0);
  assert.ok(r.results.every((i) => i.plugin === 'workflow-kit'));
});

test('counts are per type over the match set (ignoring the type filter)', () => {
  const r = search(items, 'review', { type: 'skill' });
  assert.equal(r.counts.all, r.counts.plugin + r.counts.skill + r.counts.agent);
  assert.ok(r.counts.plugin >= 1 && r.counts.skill >= 1);
});

test('the type hint filters even when only other types match', () => {
  const r = search(items, 'agent code');
  assert.ok(r.results.every((i) => i.type === 'agent'));
});

test('highlight marks matched prefixes, case-insensitively, and loses no text', () => {
  const segs = highlight('Reviews a diff for Review', ['review']);
  assert.deepEqual(segs.filter((s) => s.match).map((s) => s.text), ['Review', 'Review']);
  assert.equal(segs.map((s) => s.text).join(''), 'Reviews a diff for Review');
  assert.deepEqual(highlight('plain', []), [{ text: 'plain', match: false }]);
});

test('highlight does not match mid-word and tolerates regex characters', () => {
  assert.deepEqual(highlight('preview', ['view']).filter((s) => s.match), []);
  assert.doesNotThrow(() => highlight('a.b', ['a.b', '(x']));
});
