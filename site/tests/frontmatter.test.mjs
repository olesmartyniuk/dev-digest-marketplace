import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFrontmatter, toList } from '../scripts/lib/frontmatter.mjs';

test('parses plain and quoted values and returns the body', () => {
  const { data, body } = parseFrontmatter('---\nname: a\ndescription: "Quoted: yes"\nother: \'single\'\n---\n\n# Title\n');
  assert.equal(data.name, 'a');
  assert.equal(data.description, 'Quoted: yes');
  assert.equal(data.other, 'single');
  assert.equal(body.trim(), '# Title');
});

test('keeps " #" inside plain values (not a comment)', () => {
  const { data } = parseFrontmatter('---\ndescription: Fixes issue #12 quickly\n---\n');
  assert.equal(data.description, 'Fixes issue #12 quickly');
});

test('handles CRLF line endings', () => {
  const { data, body } = parseFrontmatter('---\r\nname: a\r\ntools: Read, Grep\r\n---\r\nBody\r\n');
  assert.equal(data.name, 'a');
  assert.equal(data.tools, 'Read, Grep');
  assert.equal(body.trim(), 'Body');
});

test('folded and literal block scalars', () => {
  const { data } = parseFrontmatter('---\nfolded: >\n  one\n  two\nliteral: |\n  one\n  two\nafter: x\n---\n');
  assert.equal(data.folded, 'one two');
  assert.equal(data.literal, 'one\ntwo');
  assert.equal(data.after, 'x');
});

test('block lists and inline lists', () => {
  const { data } = parseFrontmatter('---\ntools:\n  - Read\n  - Write\nother: [a, "b c"]\n---\n');
  assert.deepEqual(data.tools, ['Read', 'Write']);
  assert.deepEqual(data.other, ['a', 'b c']);
});

test('no frontmatter yields empty data and the whole text as body', () => {
  const { data, body } = parseFrontmatter('just text');
  assert.deepEqual(data, {});
  assert.equal(body, 'just text');
});

test('empty frontmatter block', () => {
  const { data, body } = parseFrontmatter('---\n---\nBody');
  assert.deepEqual(data, {});
  assert.equal(body, 'Body');
});

test('toList accepts strings, arrays and undefined', () => {
  assert.deepEqual(toList('Read, Grep ,Glob'), ['Read', 'Grep', 'Glob']);
  assert.deepEqual(toList(['A', 'B']), ['A', 'B']);
  assert.deepEqual(toList(undefined), []);
});
