---
type: llm
---
PASS only if the report satisfies ALL of the following:
- Flags the domain file (checkout.ts) importing a type from 'fastify' as a violation of the inward-only dependency rule (rule name no-domain-outward)
- Flags the `new PgCheckoutRepository()` call inside service.ts as a violation of dependency-injection discipline (a concrete repository/adapter constructed in a service instead of the container); cites a rule from the agent's catalogue such as ports-bypass or no-service-imports-adapters-directly
- Every finding names a rule identifier from the agent's closed catalogue, not prose only
- Every finding has a severity (CRITICAL / HIGH / MEDIUM)
- Every finding quotes the offending line verbatim as evidence, with a path:line locator
- Status is VIOLATIONS (not CLEAN)
- States that the report is advisory and does not propose a full patch (a one-line fix direction is fine)
FAIL if any item is missing or a finding is not in the diff.
