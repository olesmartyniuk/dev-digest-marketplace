# Skill catalog

| Skill | Scope | Supporting files | Consumed by |
|---|---|---|---|
| `react-best-practices` | frontend | `examples.md` | implementer, planner |
| `react-frontend-best-practices` | frontend | `examples.md`, `references/sources.md` | implementer, planner |
| `next-best-practices` | frontend | 18 topic files (RSC, data, metadata, bundling, ...) | implementer, planner |
| `fastify-best-practices` | backend | `rules/*.md` (routes, plugins, schemas, hooks, ...) | implementer, planner |
| `onion-architecture` | backend | `examples.md`, `references/sources.md` | implementer, architecture-reviewer |
| `react-testing-library` | testing | `README.md` | implementer |
| `security` | full-stack | `checklists.md`, `examples.md`, `references.md` | implementer |

## How skills are loaded

Skills are not preloaded into agents. An agent (or you) calls the `Skill` tool with the namespaced name, e.g.
`engineering-paved-path:onion-architecture`, before touching the files the skill governs. Each `SKILL.md` stays short
and links to its supporting files, which are read only when needed.

## Adding a skill

1. Create `skills/<name>/SKILL.md` with `name` and a `description` that states what it covers and when to use it
   (the catalog site and Claude's trigger matching both depend on it).
2. Add a trigger case under `evals/<name>-trigger/`.
3. Bump the minor version and add a CHANGELOG entry.
