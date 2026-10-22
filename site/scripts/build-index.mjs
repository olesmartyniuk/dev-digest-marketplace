#!/usr/bin/env node
// Walks the marketplace and writes the search index the static site loads.
//   node scripts/build-index.mjs --out public/search-index.json [--root ..] [--repo owner/name]
// The repository slug comes from --repo, then GITHUB_REPOSITORY, then `git remote origin`.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { collect, repoFromRemote } from './lib/collect.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = parseArgs(process.argv.slice(2));
const root = path.resolve(args.root ?? path.join(here, '..', '..'));
const out = path.resolve(args.out ?? path.join(here, '..', 'public', 'search-index.json'));

try {
  const { marketplace, items } = collect(root);
  const repo = args.repo ?? process.env.GITHUB_REPOSITORY ?? gitRepo(root);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify({ generatedAt: new Date().toISOString(), repo, marketplace, items }));
  const counts = ['plugin', 'skill', 'agent'].map((t) => `${items.filter((i) => i.type === t).length} ${t}s`);
  console.log(`Indexed ${counts.join(', ')} -> ${path.relative(process.cwd(), out)}`);
} catch (err) {
  console.error(`build-index failed: ${err.message}`);
  process.exit(1);
}

function gitRepo(cwd) {
  try {
    return repoFromRemote(execFileSync('git', ['config', '--get', 'remote.origin.url'], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
  } catch {
    return null;
  }
}

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 2) {
    if (!argv[i].startsWith('--') || argv[i + 1] === undefined) throw new Error(`Bad arguments near "${argv[i]}"`);
    parsed[argv[i].slice(2)] = argv[i + 1];
  }
  return parsed;
}
