---
name: onion-architecture
description: "Onion/ports-and-adapters layering for a backend: the dependency rule (inner layers never import outer layers), how it maps onto a routes → service → repository → adapters module shape, where a new business rule / use case / external integration / endpoint belongs, and how to enforce the layering mechanically with dependency-cruiser or a similar import-rule check. Use whenever the user asks about onion/clean/hexagonal architecture, layered architecture, domain vs application vs infrastructure vs presentation layers, where new server code should live, adding a new module/adapter/port, dependency direction between layers, reviewing a server module for layering violations, or why an architecture/dependency-cruiser check is failing. Complements fastify-best-practices (route/plugin mechanics) — this skill governs which layer code is allowed to live in, not how to write the code inside it."
---

# Onion Architecture (Backend)

Governs *which layer server code belongs in and which way dependencies point* — not how to write a web-framework route or a database query (see `fastify-best-practices` for route mechanics). Sources in [references/sources.md](references/sources.md); good/bad code in [examples.md](examples.md).

The layout below is the conventional module shape this skill assumes. If the target repo names things differently, map by role, not by file name, and say which mapping you used.

## Severity Levels

- **CRITICAL** — Breaks the dependency rule (inner imports outer). Untestable domain/application logic, hard-to-swap infrastructure.
- **HIGH** — Layer discipline drift that will compound (SQL/HTTP leaking outside its layer, a module reaching into another module's internals).
- **MEDIUM** — Naming/placement consistency within a layer.

---

## The One Invariant: The Dependency Rule (CRITICAL)

Onion, Clean, and Hexagonal architecture are the same idea with different names for the rings. The only thing that actually matters across all of them:

**Inner layers never import outer layers. Outer layers implement interfaces the inner layers define.**

Everything below is that rule applied to a conventional module layout — not a prescription to rename folders or adopt new jargon.

## Layers, Mapped Onto a Typical Module

| Ring (inner → outer) | Typical location | Rule |
|---|---|---|
| **Domain** | a module's `helpers.ts` / `constants.ts` / `types.ts`; any pure-logic package with no I/O dependencies | Pure functions/types/literals. No web framework, no ORM/DB client, no concrete adapters, no DI container. |
| **Ports** | a shared interfaces file (e.g. `adapters.ts` / `ports.ts`) — `LLMProvider`, `GitHubClient`, `Mailer`, `SecretsProvider`, … | Interfaces only. Read it before adding a new external integration; extend it, don't bypass it. |
| **Application** | `modules/<name>/service.ts` | Use-case orchestration. Depends on the container and the port interfaces, never on a concrete adapter class or the web framework. |
| **Infrastructure** | `modules/<name>/repository.ts`, `adapters/*`, `db/*`, the composition root (`container.ts`) | Implements the ports. Only place the ORM/DB client and vendor SDK imports belong. The container is the composition root that wires infrastructure into the ports. |
| **Presentation** | `modules/<name>/routes.ts`, app bootstrap, a shared request-context helper | HTTP + schema-validation boundary only. No SQL, no business branching. |

This is the naming for a rule most teams already state informally ("no SQL outside the repository, no HTTP outside routes, no literals outside constants"). The addition here is the **direction** — services depend on ports, not on the concrete class that implements them — and a way to check it mechanically instead of by convention alone.

## Ports — Use Them, Don't Reinvent Them

Before writing `if (isTestEnv) use fake else use real client` anywhere, check whether a port already exists: services should resolve everything external through the container (`container.git`, `container.llm(id)`, `container.github()`, …), which returns the *interface* type. Tests inject a mock through the container's overrides — never construct a client inline in a service (`new SomeSdkClient(...)` inside a `service.ts` is a finding).

**New external system** (a new LLM provider, a new source-control host, a webhook target, …):
1. Add the interface to the shared ports file (and to every vendored/duplicated copy of it, if the repo keeps more than one).
2. Implement it under `adapters/<name>/`.
3. Wire it into the container as a lazily-constructed getter, with an overrides slot for tests.
4. Consume it from `service.ts` via `this.container.<name>` — never `import` the adapter class into a service.
5. Secrets come from a secrets provider or validated config, never `process.env` inside a service.

## Where New Code Goes

| Question | Answer |
|---|---|
| A pure business rule / calculation | `helpers.ts` |
| A new use case / orchestration step | `service.ts` |
| A DB query | `repository.ts` — never inline in `service.ts` or `routes.ts`, and not via `container.db.*` in a service |
| A new external system call | An interface in the ports file + an implementation in `adapters/<name>/` + a container getter |
| A new HTTP endpoint | `routes.ts` — thin: validate via schema, call one `service` method, return |
| A literal/magic string used once | Inline; used across a module → `constants.ts` |
| Data needed by a different module | `container.<x>Repo` / `container.<x>` (composition root), **not** `import ... from '../other-module/...'` |

## Enforcement: an import-rule check

Layer discipline is best checked mechanically with `dependency-cruiser` (or an equivalent import-rule tool) wired into CI and exposed as a package script (commonly `arch`, `lint:arch` or `depcruise`). Look in the target repo's `package.json` for it; if none exists, recommend adding one rather than assuming it is there.

Rules worth enforcing:
- `no-domain-outward` — `helpers`/`constants`/`types` can't import the web framework, ORM, adapters, container or db layer.
- `no-http-outside-presentation` — only the route layer, app bootstrap and the request-context helper may import the web framework.
- `no-sql-outside-persistence` — only repository files and the db layer may import the ORM/DB client.
- `no-service-imports-adapters-directly` — services can't import from `adapters/` (go through the container).
- `no-cross-module-reach` — a module can't import another module's folder directly (except an explicit shared folder); cross-module access goes through the container.
- `no-circular` — no import cycles.

**Import rules have blind spots.** A service that calls `container.db.query...` or builds SQL strings imports no ORM, so `no-sql-outside-persistence` stays green while persistence still leaks into the application layer. Likewise `fetch(...)`, `process.env` reads and `NODE_ENV === 'test'` branching in a service are invisible to import rules. Review for these by reading.

**Pre-existing drift is frozen, not required to be fixed to adopt the rules.** A known-violations baseline (`depcruise-baseline` / `--ignore-known`) records violations that existed when the rules were introduced; the check then fails only on **new** ones. If you touch a file with a baselined violation, prefer fixing it over leaving it; don't let the baseline grow.

**Adding a genuinely justified exception:** don't loosen a rule's regex to make one call site pass. Either fix the placement, or if the exception is real (rare), add a narrowly-scoped `pathNot`/exemption to the specific rule with a `comment` explaining why — reviewed like any other architecture decision.
