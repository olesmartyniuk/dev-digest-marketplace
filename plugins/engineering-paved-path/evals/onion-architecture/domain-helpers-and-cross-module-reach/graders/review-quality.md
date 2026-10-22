---
type: llm
---
PASS only if the final answer satisfies ALL of the following:
- Flags helpers.ts importing drizzle-orm and running a DB query as a CRITICAL dependency-rule violation (no-domain-outward)
- Flags helpers.ts importing fastify / handling FastifyRequest
- Flags helpers.ts importing Container
- Flags service.ts importing ../reviews/repository.js and ../agents/service.js as cross-module reach, fix via container.reviewRepo / container.agentsRepo
- Notes service constructing another module's repository/service itself instead of via Container
- Names the violated layering rule(s) by name (e.g. no-sql-outside-persistence, no-cross-module-reach, no-circular)

FAIL if any item is missing, or if the answer reports a violation that is not in the code.
