import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { collect, repoFromRemote } from '../scripts/lib/collect.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const ok = path.join(here, 'fixtures', 'ok');
const broken = path.join(here, 'fixtures', 'broken');
const cli = path.join(here, '..', 'scripts', 'build-index.mjs');

test('collects plugins, skills and agents with a stable order and unique ids', () => {
  const { items, marketplace } = collect(ok);
  assert.equal(marketplace, 'fixture-marketplace');
  assert.deepEqual(items.map((i) => i.id), [
    'plugin:alpha',
    'plugin:beta',
    'skill:alpha/code-review',
    'skill:beta/triage',
    'agent:alpha/test-engineer',
  ]);
  assert.equal(new Set(items.map((i) => i.id)).size, items.length);
});

test('item fields: version, tools, install command, path, body vs source', () => {
  const { items } = collect(ok);
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));

  const agent = byId['agent:alpha/test-engineer'];
  assert.equal(agent.version, '1.2.0');
  assert.deepEqual(agent.tools, ['Read', 'Grep', 'Glob', 'Bash']);
  assert.equal(agent.installCommand, 'claude plugin install alpha@fixture-marketplace');
  assert.equal(agent.path, 'plugins/alpha/agents/test-engineer.md');
  assert.equal(agent.body.trim(), 'You are a QA engineer.');
  assert.ok(agent.source.startsWith('---\n'), 'source keeps frontmatter');
  assert.ok(!agent.source.includes('\r'), 'source is normalised to LF');

  const skill = byId['skill:beta/triage'];
  assert.equal(skill.description, 'Turns feedback into follow-up work.');
  assert.deepEqual(skill.tools, ['Read', 'Write']);
  assert.equal(skill.version, '0.4.1');
});

test('plugin item: plugin.json description wins, README is the body', () => {
  const { items } = collect(ok);
  const alpha = items.find((i) => i.id === 'plugin:alpha');
  assert.equal(alpha.description, 'Alpha plugin for reviewing code');
  assert.equal(alpha.path, 'plugins/alpha/README.md');
  assert.match(alpha.body, /Readme body for alpha/);
  const beta = items.find((i) => i.id === 'plugin:beta');
  assert.equal(beta.description, 'Beta plugin', 'falls back to the marketplace entry');
  assert.equal(beta.path, 'plugins/beta/.claude-plugin/plugin.json');
});

test('directories without SKILL.md are ignored', () => {
  const { items } = collect(ok);
  assert.ok(!items.some((i) => i.name === 'empty-dir'));
});

test('a skill without description fails and names the file', () => {
  assert.throws(() => collect(broken), /plugins\/gamma\/skills\/bad\/SKILL\.md/);
});

test('a plugin source outside the repository is rejected', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'idx-escape-'));
  fs.mkdirSync(path.join(dir, '.claude-plugin'));
  fs.writeFileSync(path.join(dir, '.claude-plugin', 'marketplace.json'),
    JSON.stringify({ name: 'm', plugins: [{ name: 'x', source: '../outside', description: 'd' }] }));
  assert.throws(() => collect(dir), /outside the repository/);
});

test('CLI exits non-zero on a broken artifact and prints the path', () => {
  const r = spawnSync(process.execPath, [cli, '--root', broken, '--out', path.join(os.tmpdir(), 'never.json')], { encoding: 'utf8' });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /plugins\/gamma\/skills\/bad\/SKILL\.md/);
});

test('CLI writes a valid index file', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'idx-'));
  const out = path.join(dir, 'nested', 'search-index.json');
  execFileSync(process.execPath, [cli, '--root', ok, '--out', out, '--repo', 'me/market']);
  const data = JSON.parse(fs.readFileSync(out, 'utf8'));
  assert.equal(data.repo, 'me/market');
  assert.equal(data.marketplace, 'fixture-marketplace');
  assert.match(data.generatedAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(data.items.length, 5);
});

test('repoFromRemote parses https and ssh remotes', () => {
  assert.equal(repoFromRemote('https://github.com/o/r.git'), 'o/r');
  assert.equal(repoFromRemote('git@github.com:o/r.git'), 'o/r');
  assert.equal(repoFromRemote('https://github.com/o/r'), 'o/r');
  assert.equal(repoFromRemote('https://example.com/o/r.git'), null);
  assert.equal(repoFromRemote(''), null);
});
