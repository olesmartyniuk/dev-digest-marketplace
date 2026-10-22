# research-tools

A read-only `researcher` agent. It answers a question either from **this project** (code, docs, specs) or from **the
internet**, and returns a fixed structured report in which every claim carries a locator a human can open
(`path/to/file:line` or a URL). If it finds nothing, it says so explicitly.

## Install

```
claude plugin install research-tools@dev-digest-marketplace
```

Used by `sdd-engineering`, but fully usable on its own.

## Use

```
Use research-tools:researcher in project mode: where is rate limiting configured?
Use research-tools:researcher in web mode: what changed in the latest Fastify major release?
```

- Exactly one mode per run: `PROJECT` or `WEB`. Ambiguity never switches the mode; it produces clarifying questions (at most 4).
- Tools: `Read, Grep, Glob, WebSearch, WebFetch`. It never edits files.
- Budget: at most 8 tool calls in project mode and 6 in web mode; beyond that it returns `Status: PARTIAL`.
- Statuses: `FOUND`, `PARTIAL`, `NOT FOUND`, `NEEDS INPUT`.

Details: [docs/researcher.md](docs/researcher.md).

## Evals

```
claude plugin eval ./plugins/research-tools --runs 1
```

Cases cover project-mode locators, the read-only guarantee and the explicit "not found" report. Results go to
`evals/results/` (gitignored).

## Versioning

Semver in `.claude-plugin/plugin.json`; history in the marketplace `CHANGELOG.md`. Tag format `research-tools--vX.Y.Z`.
