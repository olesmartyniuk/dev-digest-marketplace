# Spec: dev-digest-marketplace catalog site

## Objective

A public, English-only static website on GitHub Pages that lets people discover what is in this Claude Code
marketplace and install it. A visitor types a need ("I need a skill for code review"), and the site shows
matching **plugins, skills and agents** as cards. There is no backend: everything is generated in CI and
searched in the browser.

**Users**
- *Consumer*: a developer who wants to find a skill/agent, read what it does, and copy the install command.
- *Author*: a teammate who adds a plugin and wants it to show up on the site without extra steps.

**Scale**: up to 10 plugins (roughly tens of skills/agents). Whole index is loaded in memory; no pagination.

**In scope (MVP)**
1. CI-built `search-index.json` covering plugins, skills, agents only.
2. Keyword search → result cards, with type/plugin filters.
3. Artifact detail view (full description, tools, markdown source, link to GitHub).
4. Copy-to-clipboard install commands.
5. "Request a new skill" link that opens a pre-filled GitHub Issue.
6. Deploy to GitHub Pages from GitHub Actions on every push to `main`.

**Out of scope (v2 or never)**
- v2: changelog / "what's new", bundle builder, "related artifacts".
- Never (needs a backend): ratings, install counters, comments, accounts, LLM/semantic search.
- Not indexed: commands, hooks, MCP servers, other file types.

## Assumptions (confirm or correct)

1. Site is served from `https://<org>.github.io/dev-digest-marketplace/` (project Pages), so all URLs are **relative**.
2. Repo is public; showing full SKILL.md / agent prompt text is acceptable.
3. CI runs Node 20+ for the indexer only. The shipped site has **no build step and no runtime dependencies**.
4. Skills/agents are installed via their parent plugin (Claude Code has no separate install for them), so a skill/agent card shows its plugin's install command.
5. Authors write `description` in English; search quality depends on it.
6. Modern evergreen browsers only (ES modules, `fetch`, `navigator.clipboard`).

## Tech Stack

- Frontend: plain HTML + CSS + vanilla JS (ES modules). No framework, no bundler, no npm runtime deps.
- Indexer: Node.js 20+ script (`.mjs`; CI uses 22), zero dependencies (own minimal frontmatter parser).
- Tests: built-in `node:test` runner (indexer and search logic are pure modules, so they run in Node).
- CI/CD: GitHub Actions → `actions/upload-pages-artifact` + `actions/deploy-pages`.

## Data model: `search-index.json`

Generated, **never committed** (listed in `site/.gitignore`), written to `site/public/search-index.json`.

```json
{
  "generatedAt": "2026-10-19T10:00:00Z",
  "repo": "<org>/dev-digest-marketplace",
  "marketplace": "dev-digest-marketplace",
  "items": [
    {
      "id": "skill:example-plugin/example-skill",
      "type": "skill",
      "name": "example-skill",
      "plugin": "example-plugin",
      "version": "0.1.0",
      "description": "…",
      "tools": [],
      "path": "plugins/example-plugin/skills/example-skill/SKILL.md",
      "body": "markdown after the frontmatter (searched)",
      "source": "the whole file as written, frontmatter included (shown in the detail preview)",
      "installCommand": "claude plugin install example-plugin@dev-digest-marketplace"
    }
  ]
}
```

Rules:
- `type` ∈ `plugin | skill | agent`. `id` is `<type>:<plugin>[/<name>]` and is unique.
- Plugins come from `.claude-plugin/marketplace.json` merged with each `plugin.json`; skills from
  `plugins/*/skills/*/SKILL.md`; agents from `plugins/*/agents/*.md`.
- Missing/invalid frontmatter (`name`, `description`) → **indexer exits non-zero** with the file path. A broken
  artifact fails the deploy rather than silently disappearing.
- Output is deterministic (items sorted by type, plugin, name) so diffs and tests are stable.
- A plugin item's `body`/`source` come from its `README.md` (or `plugin.json` when there is no README);
  its description comes from `plugin.json`, falling back to the marketplace entry.
- `repo` comes from `--repo`, then `GITHUB_REPOSITORY`, then the `origin` git remote, else `null`
  (the UI then hides GitHub links and shows `<org>/dev-digest-marketplace` as a placeholder).
- A plugin `source` that resolves outside the repository is rejected.

## Search behaviour

Pure function `search(items, query) → ranked items`, no DOM access.

1. Lowercase, split on non-alphanumerics, drop English stopwords (`i, need, a, an, the, for, to, of, that, me, want, …`).
2. **Type words** (`skill(s)`, `agent(s)`, `plugin(s)`) are removed from the terms and become a type filter
   (so "I need a skill for code review" → type=skill, terms=`code`, `review`). The UI filter chips override it.
3. Each term matches a whole word of a field by exact or prefix (`review` matches `reviewer`, never mid-word;
   a trailing plural `s` is also tried, so `reviews` finds `review`). All terms must match somewhere (AND);
   if that yields nothing, fall back to ANY term and mark results as "partial match".
4. Field weights: name ×5, description ×3, plugin name ×2, body ×1. Ties broken by type (plugin, skill, agent) then name.
5. Empty query → all items, grouped by plugin. No results → empty state with a "Request a new skill" link.
6. Query lives in the URL (`?q=…&type=…&plugin=…`) and is restored on load; input is debounced ~100 ms.

## UI

- **Header**: title, search input (`/` focuses it; no autofocus, so phones do not pop the keyboard), filter chips
  (All / Plugins / Skills / Agents, with match counts), plugin dropdown. A type word in the query selects its chip;
  clicking a chip overrides it.
- **Card**: type badge, name, description clamped to 3 lines, plugin + version, tools (agents), highlighted matches,
  "Copy install command", "View details".
- **Detail view** (`#/<type>/<plugin>/<name>`, hash routing so Pages needs no rewrites): full description, tools,
  install command(s) with copy buttons, source text as a read-only plain-text preview in a monospace block
  (no "copy source" button), "View on GitHub" link
  (`https://github.com/<repo>/blob/main/<path>`), back link preserving the previous query.
- **Footer**: "Maintained by Oleksandr Martyniuk" (owner/org display name), "Request a new skill" → `https://github.com/<repo>/issues/new?template=skill-request.yml&title=…`
  (query text pre-filled when present); "How to contribute" → README anchor; `generatedAt`.
- Markdown source is shown as **plain text**, never injected as HTML (no XSS surface, no markdown library). Rendered markdown is a possible v2 item.
- Accessibility: semantic HTML, labelled input, keyboard operable cards/buttons, visible focus, `aria-live` result count,
  contrast ≥ WCAG AA, `prefers-color-scheme` dark/light.

## Commands

Run from `site/` (the catalog lives in its own directory so it is not mixed with the marketplace itself):

```
Build index:      npm run build:index     # node scripts/build-index.mjs --out public/search-index.json
Test:             npm test                # node --test (discovers tests/*.test.mjs on Node 20, 22, 24)
Serve locally:    npm run serve           # npx --yes serve public; build the index first
Validate plugins: claude plugin validate . --strict      # from the repo root, unchanged
```

CI (`.github/workflows/pages.yml`, on push to `main`, pull requests and manual dispatch):
`checkout → setup-node 22 → npm test → build index → configure-pages → upload-pages-artifact (site/public) → deploy-pages`.
Pull requests stop after the index build; only `main` deploys. A failing test or indexer error blocks deploy.
One-time setup: repository Settings → Pages → Source = **GitHub Actions**.

## Project Structure

```
.claude-plugin/marketplace.json   → marketplace manifest (existing, source of truth for plugins)
plugins/                          → plugins, skills, agents (existing, source of truth for content)
site/                             → the catalog website; everything below is inside it
  package.json                    → scripts only, no dependencies ("type": "module")
  scripts/build-index.mjs         → CLI: walks the repo, writes search-index.json
  scripts/lib/frontmatter.mjs     → minimal YAML-frontmatter parser
  scripts/lib/collect.mjs         → builds items from the filesystem (pure, testable)
  public/                         → what is deployed to GitHub Pages
    index.html                    → single page shell
    css/styles.css                → tokens (light/dark) + components
    js/app.js                     → wiring: fetch index, state, router, events
    js/search.js                  → pure search/tokenize/rank/highlight (shared with tests)
    js/render.js                  → card / detail / state DOM builders
    search-index.json             → generated, gitignored
  tests/                          → node:test files + fixtures/
.github/workflows/pages.yml       → CI + deploy
.github/ISSUE_TEMPLATE/skill-request.yml
SPEC.md, DESIGN-BRIEF.md
```

Browser modules use the `.js` extension (not `.mjs`) so every static host serves them with a JavaScript MIME type.

## Code Style

Vanilla ES modules, 2-space indent, semicolons, `const` by default, no classes unless needed, small pure functions,
DOM built with `textContent`/`createElement` (never `innerHTML` with data). Files `kebab-case`, English comments only
where the *why* is non-obvious.

```js
// site/public/js/search.js
const WEIGHTS = { name: 5, description: 3, plugin: 2, body: 1 };

export function scoreItem(item, terms) {
  let score = 0;
  for (const term of terms) {
    for (const [field, weight] of Object.entries(WEIGHTS)) {
      if (matchesTerm(item[field] ?? '', term)) score += weight;
    }
  }
  return score;
}
```

## Testing Strategy

| Level | What | Where |
|---|---|---|
| Unit | frontmatter parser (valid, missing fields, quoted values, multiline) | `tests/frontmatter.test.mjs` |
| Unit | tokenizer, stopwords, type-word extraction, prefix match, AND→OR fallback, ranking order | `tests/search.test.mjs` |
| Integration | `collect` + `build-index` on `tests/fixtures/` (2 plugins; one broken fixture must fail with a path in the error) | `tests/build-index.test.mjs` |
| Integration | run indexer on the real repo; assert schema + unique ids + every plugin in marketplace.json present | `tests/real-repo.test.mjs` |
| Manual (pre-release) | keyboard-only pass, mobile width, dark mode, copy buttons, deep link `?q=`, detail route reload | checklist in PR |

Search and indexer logic must have tests before implementation (TDD). DOM code is kept thin and covered by the
manual checklist; no browser-automation framework in MVP.

## Boundaries

**Always**
- Keep the index generated from the repo; never hand-edit `search-index.json`.
- Use relative URLs; the site must work under `/dev-digest-marketplace/`.
- Build DOM via `textContent`; treat all index content as untrusted text.
- Run `node --test tests/` before committing; fail the build on malformed artifacts.

**Ask first**
- Adding any runtime or dev dependency (npm package, CDN script, web font).
- Changing the index schema (it is the contract between indexer and UI).
- Changing CI/Pages workflow permissions, or adding analytics of any kind.
- Moving/renaming plugin directories (the indexer's source of truth).

**Never**
- Commit secrets or tokens; add a backend, database or third-party data store.
- Render markdown/HTML from the index with `innerHTML`.
- Delete or skip failing tests to get CI green.
- Index or publish anything outside `plugins/` and `marketplace.json`.

## Success Criteria

1. Push to `main` deploys the site; a new plugin/skill/agent appears on it with **no manual steps** beyond what README already requires.
2. Indexer on the current repo outputs 1 plugin + 1 skill + 1 agent, valid against the schema; a fixture with missing `description` makes it exit non-zero naming the file.
3. Query "I need a skill for code review" returns only skills, ranked by name > description > plugin > body matches (verified by a unit test).
4. Query `agent` alone lists all agents; empty query lists everything; a nonsense query shows the empty state with the request-skill link.
5. "Copy install command" puts exactly `claude plugin install <plugin>@dev-digest-marketplace` on the clipboard; the marketplace-add command is shown once on the page header/detail.
6. Deep link `?q=review&type=skill` and `#/skill/<plugin>/<name>` both work on fresh load/refresh.
7. Search over 10 plugins (~100 items) responds < 50 ms; total first load ≤ 200 KB uncompressed excluding the index; Lighthouse Accessibility ≥ 95, Performance ≥ 95.
8. No console errors; no use of `innerHTML` with index data (grep check in CI).

## Open Questions

1. **Issue template** (`.github/ISSUE_TEMPLATE/skill-request.yml`) currently has "What do you need?" (required) and
   "Example use case" (optional). Add fields only if you want more.

## Decisions log

- Owner/org display name: **Oleksandr Martyniuk** (Latin spelling, since the site is English-only). The GitHub
  `<org>/<repo>` slug used in links is derived in CI from `GITHUB_REPOSITORY`, never hard-coded.
- No "copy SKILL.md" / copy-source action anywhere. Only install commands are copyable.
- Detail view shows the markdown source as a plain-text preview (no markdown rendering in MVP).
- No brand, colors or logo yet: the site uses a neutral, system-font, token-based theme that can be re-skinned
  later by changing CSS custom properties only. Visual design is specified in `DESIGN-BRIEF.md`.
