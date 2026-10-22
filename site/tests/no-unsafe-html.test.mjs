import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const jsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'js');
const UNSAFE = /\b(innerHTML|outerHTML|insertAdjacentHTML)\b|document\.write\b|\beval\s*\(|new Function\s*\(/;

test('browser code never writes HTML strings (index content is untrusted text)', () => {
  const offenders = [];
  for (const file of fs.readdirSync(jsDir).filter((f) => f.endsWith('.js'))) {
    fs.readFileSync(path.join(jsDir, file), 'utf8').split('\n').forEach((line, i) => {
      if (!/^\s*\/\//.test(line) && UNSAFE.test(line)) offenders.push(`${file}:${i + 1}: ${line.trim()}`);
    });
  }
  assert.deepEqual(offenders, []);
});
