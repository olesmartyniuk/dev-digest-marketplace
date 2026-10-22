import fs from 'node:fs';
import path from 'node:path';
import { parseFrontmatter, toList } from './frontmatter.mjs';

const TYPE_ORDER = { plugin: 0, skill: 1, agent: 2 };

export function collect(root) {
  const manifest = readJson(root, '.claude-plugin/marketplace.json');
  if (!manifest.name || !Array.isArray(manifest.plugins)) {
    throw new Error('.claude-plugin/marketplace.json: "name" and "plugins" are required');
  }

  const items = [];
  for (const entry of manifest.plugins) {
    if (!entry.name || typeof entry.source !== 'string') {
      throw new Error(`.claude-plugin/marketplace.json: plugin "${entry.name ?? '?'}" needs a string "source"`);
    }
    const pluginDir = path.resolve(root, entry.source);
    if (!isInside(root, pluginDir)) {
      throw new Error(`.claude-plugin/marketplace.json: source of "${entry.name}" points outside the repository`);
    }

    const manifestRel = rel(root, path.join(pluginDir, '.claude-plugin', 'plugin.json'));
    const pluginJson = fs.existsSync(path.join(root, manifestRel)) ? readJson(root, manifestRel) : {};
    const version = String(pluginJson.version ?? entry.version ?? '');
    const base = { plugin: entry.name, version, installCommand: `claude plugin install ${entry.name}@${manifest.name}` };

    items.push(pluginItem(root, pluginDir, manifestRel, entry, pluginJson, base));
    items.push(...skillItems(root, pluginDir, base));
    items.push(...agentItems(root, pluginDir, base));
  }

  const ids = new Set();
  for (const item of items) {
    if (ids.has(item.id)) throw new Error(`Duplicate artifact id "${item.id}" (${item.path})`);
    ids.add(item.id);
  }
  items.sort((a, b) => TYPE_ORDER[a.type] - TYPE_ORDER[b.type] || cmp(a.plugin, b.plugin) || cmp(a.name, b.name));
  return { marketplace: manifest.name, items };
}

function pluginItem(root, pluginDir, manifestRel, entry, pluginJson, base) {
  const description = pluginJson.description ?? entry.description;
  if (!description) throw new Error(`${manifestRel}: "description" is required for plugin "${entry.name}"`);
  const readme = path.join(pluginDir, 'README.md');
  const hasReadme = fs.existsSync(readme);
  const source = hasReadme ? readText(readme) : readText(path.join(root, manifestRel), JSON.stringify(pluginJson, null, 2));
  return {
    id: `plugin:${entry.name}`, type: 'plugin', name: entry.name, ...base,
    description: String(description), tools: [],
    path: hasReadme ? rel(root, readme) : manifestRel,
    body: hasReadme ? source : '', source,
  };
}

function skillItems(root, pluginDir, base) {
  const dir = path.join(pluginDir, 'skills');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(dir, d.name, 'SKILL.md')))
    .map((d) => fileItem(root, path.join(dir, d.name, 'SKILL.md'), 'skill', base));
}

function agentItems(root, pluginDir, base) {
  const dir = path.join(pluginDir, 'agents');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isFile() && d.name.endsWith('.md'))
    .map((d) => fileItem(root, path.join(dir, d.name), 'agent', base));
}

function fileItem(root, file, type, base) {
  const filePath = rel(root, file);
  const source = readText(file);
  const { data, body } = parseFrontmatter(source);
  for (const field of ['name', 'description']) {
    if (typeof data[field] !== 'string' || !data[field].trim()) {
      throw new Error(`${filePath}: frontmatter "${field}" is required`);
    }
  }
  return {
    id: `${type}:${base.plugin}/${data.name}`, type, name: data.name, ...base,
    description: data.description, tools: toList(data.tools), path: filePath, body, source,
  };
}

export function repoFromRemote(url) {
  const m = String(url ?? '').trim().match(/github\.com[:/]([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/);
  return m ? `${m[1]}/${m[2]}` : null;
}

function readText(file, fallback) {
  try {
    return fs.readFileSync(file, 'utf8').replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  } catch (err) {
    if (fallback !== undefined) return fallback;
    throw err;
  }
}

function readJson(root, relPath) {
  try {
    return JSON.parse(readText(path.join(root, relPath)));
  } catch (err) {
    throw new Error(`${relPath}: ${err.message}`);
  }
}

const rel = (root, abs) => path.relative(root, abs).split(path.sep).join('/');
const isInside = (root, abs) => { const r = path.relative(root, abs); return !r.startsWith('..') && !path.isAbsolute(r); };
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
