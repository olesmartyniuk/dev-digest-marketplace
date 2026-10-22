---
type: llm
---
PASS only if the final answer satisfies ALL of the following:
- Flags inline Drizzle query/insert in service.ts as a violation and says to move it to repository.ts
- Flags direct import/construction of the concrete GitHub adapter (GithubRestClient) in service.ts and says to use container.github() / the port
- Flags `new Octokit(...)` (vendor SDK) inside the service
- Flags process.env read inside the service (secrets via SecretsProvider/Container)
- Names the violated layering rule(s) by name (e.g. no-sql-outside-persistence, no-cross-module-reach, no-circular)
- Assigns explicit severity levels to findings

FAIL if any item is missing, or if the answer reports a violation that is not in the code.
