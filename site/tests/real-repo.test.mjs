import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { collect } from '../scripts/lib/collect.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

test('the real repository indexes cleanly and every marketplace plugin is present', () => {
  const { items, marketplace } = collect(root);
  const manifest = JSON.parse(fs.readFileSync(path.join(root, '.claude-plugin', 'marketplace.json'), 'utf8'));
  assert.equal(marketplace, manifest.name);
  assert.equal(new Set(items.map((i) => i.id)).size, items.length);
  for (const p of manifest.plugins) {
    assert.ok(items.some((i) => i.type === 'plugin' && i.name === p.name), `plugin ${p.name} missing`);
  }
  for (const i of items) {
    assert.ok(['plugin', 'skill', 'agent'].includes(i.type));
    assert.ok(i.name && i.description && i.plugin && i.path && i.installCommand, `incomplete item ${i.id}`);
    assert.ok(Array.isArray(i.tools));
  }
});
