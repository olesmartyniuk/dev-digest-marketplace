# engineering-paved-path

Skills that describe the team's paved path for web engineering: React, Next.js, Fastify, onion architecture,
React Testing Library and security. Claude loads each one on demand when the task matches its description.

## Install

```
claude plugin install engineering-paved-path@dev-digest-marketplace
```

Installed automatically as a dependency of `sdd-engineering`.

## Skills

| Skill | Use it when |
|---|---|
| `react-best-practices` | writing, reviewing or refactoring React components, hooks and state |
| `react-frontend-best-practices` | deciding where React code lives: folders, shared vs local components, constants, utils, logic placement |
| `next-best-practices` | Next.js App Router: file conventions, RSC boundaries, data patterns, metadata, bundling |
| `fastify-best-practices` | building or debugging Fastify servers: routes, plugins, schemas, hooks, error handling |
| `onion-architecture` | layering a backend: dependency direction, where a new rule or integration belongs |
| `react-testing-library` | writing or setting up React tests with RTL and Vitest |
| `security` | reviewing or writing code touching auth, input, uploads, secrets (OWASP Top 10:2025) |

Invoke explicitly as `/engineering-paved-path:<skill>`, or let Claude pick by the task. Other plugins refer to them
as `engineering-paved-path:<skill>`.

Per-skill detail and upstream sources: [docs/catalog.md](docs/catalog.md), [docs/sources.md](docs/sources.md).

## Evals

```
claude plugin eval ./plugins/engineering-paved-path --runs 1
```

One trigger case per skill (does the right skill fire for a natural prompt) plus quality cases for
`onion-architecture` built on small fixture modules. Results go to `evals/results/` (gitignored).

## Versioning

Semver in `.claude-plugin/plugin.json`; history in the marketplace `CHANGELOG.md`. Tag format
`engineering-paved-path--vX.Y.Z`. Adding or removing a skill is a minor or major bump respectively, because other
plugins reference skills by name.
