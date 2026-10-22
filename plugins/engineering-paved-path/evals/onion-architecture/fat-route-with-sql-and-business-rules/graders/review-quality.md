---
type: llm
---
PASS only if the final answer satisfies ALL of the following:
- Flags SQL/Drizzle queries inside routes.ts and says to move to repository.ts
- Flags business rules (name normalisation, reserved names, 10-label limit) in the route and says to move to service.ts/helpers.ts
- States the route should be thin: Zod parse, one service call, return
- Flags magic literals (24, 10, '#888888', reserved regex) and says to put in constants.ts
- Notes missing service.ts/repository.ts for the module (module shape routes->service->repository)
- Names the violated layering rule(s) by name (e.g. no-sql-outside-persistence, no-cross-module-reach, no-circular)

FAIL if any item is missing, or if the answer reports a violation that is not in the code.
