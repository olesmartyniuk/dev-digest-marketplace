# architecture-review

A read-only `architecture-reviewer` agent. It checks a diff, a list of paths, or a plan's changed files against
onion / ports-and-adapters layering and returns only findings backed by evidence: a rule from a closed catalogue,
`file:line`, and a quote of the offending code.

It is **advisory**: it never edits files and gates nothing by itself. A human or the `plan-verifier` agent decides.

## Install

```
claude plugin install architecture-review@dev-digest-marketplace
```

Installed automatically as a dependency of `sdd-engineering`. At run time it loads
`engineering-paved-path:onion-architecture` (install `engineering-paved-path` too; without it the agent says so under
"Not covered" and reviews against its built-in catalogue).

## Use

```
Use architecture-review:architecture-reviewer on the diff against main. Architecture check: npm run arch
```

- **Architecture check command**: pass it in the prompt, or the agent looks for an obvious script in the target repo's
  `package.json` (`arch`, `lint:arch`, `check:architecture`, a dependency-cruiser script). If none exists, the report
  says `not run — no architecture check configured` and its status is `PARTIAL`, never `CLEAN`.
- **Tools**: `Read, Grep, Glob, Bash, Skill`. Bash is an allowlist: the architecture check plus read-only `git`
  (`merge-base`, `diff`, `status`, `log`, `show`).
- **Statuses**: `CLEAN`, `VIOLATIONS`, `PARTIAL`.

Rule catalogue and report format: [docs/rules.md](docs/rules.md).

## Evals

```
claude plugin eval ./plugins/architecture-review --runs 1
```

`layer-violation` expects findings with file:line, a quote and a named rule; `benign-refactor` expects `CLEAN` with no
findings. Results go to `evals/results/` (gitignored).

## Versioning

Semver in `.claude-plugin/plugin.json`; history in the marketplace `CHANGELOG.md`. Tag format
`architecture-review--vX.Y.Z`. Adding a rule to the catalogue is a minor bump; removing or renaming one is a major bump
because other plugins parse the report.
