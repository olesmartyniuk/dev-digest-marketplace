# Differences from the original DevDigest agents

The agents and skills originate in the DevDigest repository. This plugin keeps their structure, hard rules, status
values and hand-back formats, and removes everything tied to that repository.

| Area | Original | In this plugin |
|---|---|---|
| Project knowledge | read `CLAUDE.md`, `INSIGHTS.md`, package map, vendored contracts | reads whichever of `CLAUDE.md`, `AGENTS.md`, `README.md`, `CONTRIBUTING.md`, `package.json` exist |
| Folders | fixed `docs/plans/`, per-package `specs/` | defaults `docs/plans/` and `specs/`, overridable in the prompt |
| Verification | `pnpm typecheck / test / arch` per package | commands from the plan, else discovered from the target repo's scripts |
| Skills | preloaded via `skills:` frontmatter, plus a `pr-self-review` path map | invoked with the `Skill` tool as `engineering-paved-path:<skill>`; built-in table over the 7 shipped skills |
| Other agents | referenced by bare name | namespaced: `sdd-engineering:*`, `architecture-review:architecture-reviewer`, `research-tools:researcher` |
| Pipeline | implementer, reviewer, verifier, `test-writer` | the same without the `test-writer` stage (not shipped) |
| Scripts | `.claude/skills/...` path | `${CLAUDE_SKILL_DIR}/scripts/...` |
| Do-not-touch | root `CLAUDE.md` list | the plan's own Do-not-touch section |

Not shipped: `test-writer`, `doc-writer`, `architecture-reviewer-lite`, and skills such as `zod`, `typescript-expert`,
`drizzle-orm-patterns`, `postgresql-table-design`, `pr-self-review`, `engineering-insights`, `mermaid-diagram`.
Cross-plugin `skills:` preloading is not relied upon; skills are loaded on demand instead.
