# Onion Architecture — Examples

Illustrative good and bad code for each layering rule. The names (`RepoService`, `Container`, `repository.ts`) follow the conventional module shape described in [SKILL.md](SKILL.md); map them onto the target repo by role.

## Application layer depends on the port, not the adapter

**Good** — `RepoService` calls `this.container.git.clone(...)` and `this.container.secrets.get(...)`. It never imports a concrete git client or secrets provider. Swapping the implementation, or injecting a mock in tests through the container's overrides, needs zero changes here.

```ts
export class RepoService {
  constructor(private container: Container) {}

  async runCloneJob(payload: CloneJobPayload): Promise<void> {
    const token = await this.container.secrets.get(GITHUB_TOKEN_SECRET);
    const { path } = await this.container.git.clone({ owner, name }, cloneUrl, { depth: CLONE_DEPTH });
    await this.repo.updateClonePath(repoId, path);
  }
}
```

**Bad** — constructing or importing the concrete adapter inside a service:

```ts
// service.ts
import { SimpleGitClient } from '../../adapters/git/simple-git.js'; // ✗ no-service-imports-adapters-directly

export class RepoService {
  private git = new SimpleGitClient(this.config.cloneDir); // ✗ bypasses the container, untestable without a real clone
}
```

## SQL stays in the repository

**Good** — all ORM imports and query-building live in `repository.ts`. `service.ts` calls `this.repo.findByFullName(...)`, `this.repo.insert(...)` — plain method calls, no query builders in sight.

**Bad** — a route or service running a query inline:

```ts
// routes.ts or service.ts
import { eq } from 'drizzle-orm'; // ✗ no-sql-outside-persistence
const rows = await container.db.select().from(t.settings).where(eq(t.settings.workspaceId, workspaceId));
```

A subtler variant slips past import rules entirely — `container.db.query.pulls.findMany(...)` or an interpolated SQL string in a service imports no ORM, yet persistence still leaks into the application layer (`persistence-leak`). Review for it by reading.

## Routes stay thin

**Good** — every handler is parse → one `service.<method>()` call → shape the response. No branching business logic, no direct repository/adapter access.

```ts
app.post('/pulls/:id/review', { schema: { params: IdParams } }, async (req) => {
  const { workspaceId } = await getContext(container, req);
  const body = RunRequest.parse(req.body ?? {});
  const targets = await service.resolveTargets(workspaceId, body);
  const { runs, reviews } = await service.runReview(workspaceId, req.params.id, targets, req.log);
  return { pr_id: req.params.id, runs, reviews };
});
```

**Bad** — a route that decides things:

```ts
app.post('/pulls/:id/review', async (req) => {
  const agents = await container.agentsRepo.listEnabled(workspaceId); // ✗ business logic + repo access in routes.ts
  if (agents.length === 0) { /* ... */ }
  for (const agent of agents) { /* orchestration that belongs in service.ts */ }
});
```

## Cross-module access goes through the container

**Good** — `container.agentsRepo`, `container.reviewRepo` are constructed once in the composition root and consumed by any module that needs them.

**Bad** — one module importing another module's internals directly:

```ts
// modules/repos/service.ts
import { INDEX_JOB_KIND } from '../repo-intel/constants.js'; // ✗ no-cross-module-reach
```

Small when it is just string literals, but it turns into real coupling — and eventually an import cycle — once the other module's internals change shape.

## Domain files stay pure

**Good**: a module's `helpers.ts`/`constants.ts` import none of the web framework, ORM, adapters or container — the rule holds with zero violations, which `no-domain-outward` locks in going forward.

**Bad** — a "helper" that quietly becomes infrastructure:

```ts
// helpers.ts
import { eq } from 'drizzle-orm'; // ✗ no-domain-outward — this makes it a repository, name/move it accordingly
export function toRepoDto(row: RepoRow, db: Db) { ... }
```
