# Spec: sdd-engineering plugin family

Status: **DRAFT — awaiting approval.** No plugin files are created until this spec is approved.

## Objective

Package the spec-driven-development (SDD) pipeline from the `dev-digest` repository
(`c:\Users\Oleksandr\source\AiAgenticEngineering\L08\dev-digest\.claude\`) as installable plugins in this marketplace,
so any team can run `spec → plan → implement → review → verify` without copying files by hand.

Four plugins are added. One orchestrator depends on three building-block plugins:

```
sdd-engineering ──► engineering-paved-path   (skills: react, next, fastify, architecture, testing, security)
                ├─► research-tools           (agent: researcher)
                └─► architecture-review      (agent: architecture-reviewer)
```

**Users**
- *Consumer*: installs `sdd-engineering` once; the three dependencies come with it automatically.
- *Consumer (partial)*: installs only `engineering-paved-path`, `research-tools` or `architecture-review` on their own.
- *Author*: maintains and releases each plugin independently.

## Scope

### Included

| Plugin | Contents (source in `dev-digest/.claude/`) |
|---|---|
| `sdd-engineering` | agents `spec-creator`, `implementation-planner`, `implementer`, `plan-verifier`; skills `run-plan`, `workflow-retro` (incl. `scripts/extract_workflow_metrics.mjs`); `README.md`; `CHANGELOG.md` |
| `engineering-paved-path` | skills `react-best-practices`, `react-frontend-best-practices`, `next-best-practices`, `fastify-best-practices` (see Q1), `onion-architecture` (incl. `evals/`, `references/`, `examples.md`), `react-testing-library`, `security` — each with all of its supporting files |
| `research-tools` | agent `researcher` |
| `architecture-review` | agent `architecture-reviewer` (generalized — see "Generalization") |

### Not transferred

- Product specs (`dev-digest/specs/*`), secrets, cache (`node_modules`, `*.lock`, `scheduled_tasks.lock`, `settings.json`).
- DevDigest-specific instructions: `CLAUDE.md`, `INSIGHTS.md`, `docs/architecture.md`, `reviewer-core`, vendored `@devdigest/shared` rules.
- Agents/skills not asked for: `test-writer`, `doc-writer`, `architecture-reviewer-lite`, and skills such as `zod`, `typescript-expert`, `drizzle-orm-patterns`, `postgresql-table-design`, `pr-self-review`, `engineering-insights`, `mermaid-diagram`, `dependency-checker` (see Q2/Q3 for the consequences).

## Target structure

```
.claude-plugin/marketplace.json                 → +4 entries
CHANGELOG.md                                    → +4 sections (initial 1.0.0 each)
plugins/
  engineering-paved-path/
    .claude-plugin/plugin.json                  → version 1.0.0
    README.md
    docs/                                       → deeper docs (see "Docs")
    evals/                                      → `claude plugin eval` cases (see "Evals")
    skills/<7 skills, copied as-is>/
  research-tools/
    .claude-plugin/plugin.json                  → version 1.0.0
    README.md
    docs/
    evals/
    agents/researcher.md
  architecture-review/
    .claude-plugin/plugin.json                  → version 1.0.0
    README.md
    docs/
    evals/
    agents/architecture-reviewer.md
  sdd-engineering/
    .claude-plugin/plugin.json                  → version 1.0.0, declares 3 dependencies
    README.md                                   → how the plugin works (see "README")
    CHANGELOG.md                                → release history of this plugin
    docs/
    evals/
    agents/{spec-creator,implementation-planner,implementer,plan-verifier}.md
    skills/run-plan/SKILL.md
    skills/workflow-retro/SKILL.md
    skills/workflow-retro/scripts/extract_workflow_metrics.mjs
```

## Manifests

`plugin.json` is the source of truth for `name`, `version`, `description`, `author`. The marketplace entry carries `name`,
`source`, `description` (kept identical). Version lives only in `plugin.json`, so the two cannot drift
(the same rule the removed `example-plugin` template followed).

`sdd-engineering/.claude-plugin/plugin.json`:

```json
{
  "name": "sdd-engineering",
  "description": "Spec-driven development pipeline: spec, plan, implement, review, verify",
  "version": "1.0.0",
  "author": { "name": "Oleksandr" },
  "dependencies": [
    { "name": "engineering-paved-path", "version": "^1.0.0" },
    { "name": "research-tools",         "version": "^1.0.0" },
    { "name": "architecture-review",    "version": "^1.0.0" }
  ]
}
```

Dependency versions are semver ranges resolved against git tags `<plugin>--v<version>`, the same tag format that
`.github/workflows/release.yml` already creates. **Release order is therefore mandatory:** the three dependencies
are tagged first, `sdd-engineering` last; otherwise the range has nothing to resolve to.

## Generalization (what changes when copying)

The originals are written for DevDigest. A plain copy would break outside that repo, so these edits are part of the work:

1. **Namespaced references.** Plugin skills/agents are addressed as `<plugin>:<name>`.
   - `run-plan` launches `sdd-engineering:implementer`, `architecture-review:architecture-reviewer`, `sdd-engineering:plan-verifier`.
   - Agents call `research-tools:researcher`; skills as `engineering-paved-path:react-best-practices`.
   - The `skills:` preload lists in agent frontmatter are rewritten to the namespaced names, limited to skills that ship in `engineering-paved-path`.
2. **No DevDigest paths.** `docs/plans/`, `specs/`, `INSIGHTS.md`, `CLAUDE.md`, `pnpm arch`, `reviewer-core`, `@devdigest/shared`,
   and the "lesson scaffolding L02–L08" notes are removed or replaced by **explicit inputs**: the caller passes the spec/plan
   path (default suggestion `docs/plans/` and `specs/`, never required), and the architecture command comes from the caller or
   from the target repo's `package.json` scripts (e.g. `arch`), otherwise the agent reports "no architecture check configured".
3. **No `.claude/skills/` lookups.** Dynamic discovery by `Glob .claude/skills/*/SKILL.md` is dropped (installed plugin skills do not live there).
4. **Scripts via `${CLAUDE_SKILL_DIR}`.** `workflow-retro` runs `node ${CLAUDE_SKILL_DIR}/scripts/extract_workflow_metrics.mjs <session-uuid>`.
5. **`architecture-reviewer`** keeps its closed rule catalogue for generic onion layering and drops the DevDigest-only rules
   (reviewer-core purity, vendored `@devdigest/shared` copies, vendored-UI barrel).
6. **`run-plan` pipeline** is `implementer → architecture-reviewer → plan-verifier`. Stage 4 `test-writer` is not shipped (see Q2),
   so it is removed from the skill; the final report lists only the stages that ran.
7. Frontmatter `name`/`description` stay in English and keep the "use when…" triggers (search on the catalog site depends on them).
8. Agent frontmatter fields unsupported for plugin agents (`hooks`, `mcpServers`, `permissionMode`) are not used; the Figma MCP
   tool names in `spec-creator`'s `tools:` are kept (harmless if the MCP server is absent).

## README (sdd-engineering)

`plugins/sdd-engineering/README.md` explains, in English:
1. What the plugin is and the pipeline diagram (Mermaid): `spec-creator → implementation-planner → run-plan (implementer → architecture-reviewer → plan-verifier)`, with `researcher` available ad hoc.
2. Install: `claude plugin install sdd-engineering@dev-digest-marketplace`, and what gets auto-installed (3 dependencies with ranges).
3. Each agent/skill: role, inputs, outputs, status values (`COMPLETE / PARTIAL / BLOCKED / FAIL / MET / NOT MET`), what it will never do (e.g. `run-plan` never commits).
4. A worked example prompt per stage and the namespaced names.
5. Hard constraints inherited from the originals (single-shot subagents cannot ask questions → `[NEEDS CLARIFICATION]`; architecture review is advisory).
6. How to read `workflow-retro` output.
7. Versioning and where the release history lives (CHANGELOG), plus a rollback pointer to the root README.

The three dependency plugins get short READMEs (what they contain, install, which plugin consumes them).

## Docs

Each plugin has `README.md` (entry point) plus a `docs/` folder for depth. `docs/` is outside every
component path, so the loader ignores it (the docs do not state this explicitly; verified by `validate --strict` in acceptance).

| Plugin | `docs/` content |
|---|---|
| `sdd-engineering` | `pipeline.md` (stages, hand-off contracts, status values, Mermaid diagram), `usage.md` (worked prompts per stage, namespaced names), `generalization.md` (what differs from the DevDigest originals) |
| `engineering-paved-path` | `catalog.md` (each skill: scope, when it triggers, who consumes it), `sources.md` (upstream origin of each skill, as recorded in `dev-digest/skills-lock.json`) |
| `research-tools` | `researcher.md` (project vs web mode, report format, locator rule) |
| `architecture-review` | `rules.md` (closed rule catalogue, finding format, how to configure the architecture command) |

## Evals

Evals use the native `claude plugin eval` format (needs Claude Code 2.1.269+): one directory per case under
`plugins/<name>/evals/<case>/` with `prompt.md`, `graders/*.md`, and fixtures where needed. Every case runs with the plugin
and a baseline without it (default `--ablation with-without`), so the report shows the plugin's measurable effect.
The DevDigest vitest harness (`dev-digest/evals/src`) is **not** ported; it depends on repo paths. Only the
case ideas and fixtures are reused.

| Plugin | Cases (first version) |
|---|---|
| `engineering-paved-path` | one trigger case per skill (`tool_used: Skill` grader on the skill name) plus a quality case for `onion-architecture` built from the existing `skills/onion-architecture/evals/` fixtures (layer violation detected, clean-module control passes) |
| `architecture-review` | ported from `dev-digest/evals/agents/architecture-reviewer`: `checkout-service.diff` (finding with file:line + quoted code + rule), `benign-refactor.diff` (no findings); `llm` and `regex` graders; read-only (`Read, Grep, Glob`) |
| `research-tools` | project-mode question answered with a `file:line` locator for every claim; "nothing found" stated explicitly; no file edits (`file_exists` with `exists: false`) |
| `sdd-engineering` | `spec-creator` writes one spec and marks unanswered points `[NEEDS CLARIFICATION]`; `implementation-planner` returns `Status: BLOCKED` on an ambiguous spec and asks for the execution mode; `plan-verifier` returns `NOT MET` for an unimplemented step; `run-plan` stops on a gating `PARTIAL`/`FAIL` and never runs git write commands (`tool_order`/`regex not_contains` on trace). Agents are dispatched by namespaced name with `Agent` in `allowed_tools`. |

Rules:
- Cases that need files use `add_dirs` or a `scaffold_script` (runs only with `--scaffold`); no secrets or network in fixtures.
- Agents that need other plugins (`sdd-engineering` → dependencies) are evaluated with the dependencies present: `--plugin` includes them via `plugins` frontmatter.
- `evals/results/` is added to `.gitignore`.
- Run: `claude plugin eval ./plugins/<name>` locally (target the plugin dir, not the marketplace root). Evals cost tokens, so they are **not** part of `validate.yml`.
  An optional manual workflow `.github/workflows/evals.yml` (`workflow_dispatch`, input: plugin, `--trust-plugin --threshold 0.8 --max-cost-usd`) is proposed; it needs a credentials secret (see Q6).
- `claude plugin validate` does not check `evals/`; case errors surface only when `eval` loads them, so acceptance includes one real run.

## Release / versions

- Every plugin starts at **1.0.0** (`plugin.json`).
- Root `CHANGELOG.md` (existing convention, one section per plugin) gets an `1.0.0 – Initial release` entry for each of the four plugins; `sdd-engineering/CHANGELOG.md` mirrors its own entries so the file travels with the plugin.
- Release flow follows the existing `release.yml` and the root README, in this order: `engineering-paved-path`, `research-tools`,
  `architecture-review`, then `sdd-engineering`. Tags: `<plugin>--v1.0.0`.
- No workflow changes are needed. Bump `version` on any later change, and treat a breaking change in a dependency as a major bump so that `^1.0.0` is not silently crossed.

## Verification (acceptance criteria)

1. `claude plugin validate . --strict` passes (also run by `validate.yml`).
2. `cd site && npm test && npm run build:index` passes; the catalog lists 4 new plugins with 6 agents (4 + 1 + 1) and 9 skills (2 + 7), 15 items in total (indexer fails on any missing `name`/`description`, which is the intended gate).
3. `grep -ri "devdigest\|pnpm arch\|\.claude/skills\|docs/plans\|INSIGHTS" plugins/{sdd-engineering,research-tools,architecture-review}` returns only intentional occurrences (documented defaults in README).
4. Local install check: `claude plugin marketplace add ./`, then `claude plugin install sdd-engineering@dev-digest-marketplace` pulls in all three dependencies, and `/reload-plugins` shows the namespaced agents/skills.
5. Smoke test in a scratch project: `sdd-engineering:spec-creator` produces a spec, and `run-plan` resolves the `implementer`, `architecture-reviewer` and `plan-verifier` agents by namespaced name (verifies cross-plugin references and skill preloading actually work; if cross-plugin `skills:` preload does not resolve, fall back to invoking the skill by name through the `Skill` tool in the agent body).
6. `claude plugin eval ./plugins/<name> --runs 1` loads and runs every case in all four plugins without load errors, and the suites meet `--threshold 0.8` on a with-plugin arm (a failing case is fixed or reported, never lowered to pass).
7. `docs/` folders do not break `claude plugin validate . --strict`.
8. Every copied file is byte-identical to its source unless it appears in the "Generalization" list.

## Boundaries

- **Always:** copy supporting files together with their skill; keep one commit-able unit per plugin; record any deviation from the originals in the plugin README.
- **Ask first:** adding any skill/agent beyond this list; running evals in bulk (token cost) or adding the eval workflow; changing marketplace workflows; publishing releases or pushing tags.
- **Never:** modify the `dev-digest` repo; commit, tag or push without being asked; copy secrets, lock files or `node_modules`.

## Open questions (need your answer before implementation)

- **Q1. Fastify.** Your message lists "react, next, architecture, testing and security"; the slide for `engineering-paved-path` also lists Fastify.
  Default in this spec: **include** `fastify-best-practices`. Say if it should be left out.
- **Q2. `test-writer`.** The original `run-plan` has a 4th stage (`test-writer`), which is not in your agent list.
  Default: **drop that stage** (pipeline ends at `plan-verifier`). Alternative: add `test-writer` to `sdd-engineering` (and `react-testing-library` is already included).
- **Q3. Skills the agents preload but no plugin ships** (`zod`, `typescript-expert`, `drizzle-orm-patterns`, `postgresql-table-design`, `pr-self-review`, `engineering-insights`, `mermaid-diagram`).
  Default: **remove them from `skills:` lists** and drop the `pr-self-review` path→skill map the planner relies on, replacing it with a short built-in mapping to the 7 shipped skills.
  Alternative: add `zod`, `typescript-expert`, `pr-self-review` etc. to `engineering-paved-path` (larger plugin, closer to original behaviour).
- **Q4. Version/release file.** Interpreted as `CHANGELOG.md` entries (root + inside `sdd-engineering`) plus `version` in each `plugin.json`. Say if you meant a separate file (e.g. `VERSIONS.md` / `release.json`).
- **Q5. `architecture-reviewer` source.** Default is the full `architecture-reviewer.md`, not `-lite`, generalized as described.
- **Q6. Eval CI.** Default: evals are run manually, plus an optional `workflow_dispatch` workflow that needs a repository secret with Claude credentials. Say if you want that workflow, or local runs only.
- **Q7. Eval depth.** Default is the small first set in the table above (about 3–5 cases per plugin, 1–3 runs each). Say if you want more.
