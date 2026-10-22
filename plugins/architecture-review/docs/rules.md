# Rule catalogue

Findings may cite only these nine rules. Anything else is not a finding.

## Mechanical

Verified by the configured architecture check when one exists, otherwise by reading imports.

| Rule | Violation |
|---|---|
| `no-domain-outward` | pure domain files (`helpers`, `constants`, `types`) import the web framework, the ORM/DB client, concrete adapters, the DI container or the db layer |
| `no-http-outside-presentation` | the web framework is imported outside the route/controller layer, app bootstrap and the shared request-context helper |
| `no-sql-outside-persistence` | the ORM/DB client is imported outside repository files or the db layer |
| `no-service-imports-adapters-directly` | a service imports a concrete adapter instead of going through the container/ports |
| `no-cross-module-reach` | one module's folder imports another module's folder directly instead of via the composition root (a designated shared folder is exempt) |
| `no-circular` | an import cycle |

## Non-mechanical

Judged by reading; import-based tools cannot see these.

| Rule | Violation |
|---|---|
| `layer-literals` | a magic string or number used in several places or in the wrong layer instead of the module's constants file |
| `ports-bypass` | a service builds a concrete SDK client inline, calls an external system with raw `fetch`, reads secrets from `process.env`, or branches on a test-environment flag instead of using a port |
| `persistence-leak` | persistence reached without importing the ORM (`container.db.query...`, raw SQL strings in a service or route) |

Severity follows the `onion-architecture` skill's scale (CRITICAL / HIGH / MEDIUM).

## Report shape

```
**Scope:** <diff base..HEAD | diff | path list | plan path> - <N files>
**Status:** CLEAN | VIOLATIONS | PARTIAL
**Architecture check:** pass | fail - <new violation count> | not run - <why>
**Advisory:** this report gates nothing; a human or plan-verifier decides.
```

then Findings (rule, severity, `file:line`, quoted code), Not covered, and the commands run.
`CLEAN` requires an empty Findings section and a passing architecture check; no check configured means `PARTIAL`.

## Adapting to a repository

The catalogue is repository-neutral. Tell the agent the architecture command and, if layout is unusual, the
module/layer folder names in your prompt; it does not guess them.
