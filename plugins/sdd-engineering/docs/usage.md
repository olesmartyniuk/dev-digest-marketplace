# Usage

Agents are addressed by namespaced name. Prompts may be plain language; naming the agent makes dispatch explicit.

## 1. Spec

```
Use sdd-engineering:spec-creator to write a spec for: "Users can sort the orders table by date or total."
```

Optionally attach design material (a Figma link, an image or PDF mockup, existing docs); the spec is grounded only in
what was actually read. Read the hand-back's `[NEEDS CLARIFICATION]` list and answer it before planning.

To override the folder: `... file it under apps/web/specs/`.

## 2. Plan

```
Use sdd-engineering:implementation-planner on specs/SPEC-01-orders-sorting.md.
```

If the planner returns `Status: BLOCKED`, answer its questions (or update the spec) and run it again. When it returns
`READY FOR IMPLEMENTER`, it asks which mode to use:

- **multi-agent**: run `/sdd-engineering:run-plan <plan>`; each stage is its own agent.
- **single-pass**: one agent executes the whole plan in one go.

## 3. Run

```
/sdd-engineering:run-plan docs/plans/2026-10-21-orders-sorting.md
```

Output is a table of stage verdicts, the changed files, and a reminder that nothing was committed. Review with
`git diff`, then commit yourself.

## 4. Individual stages

```
Use sdd-engineering:implementer on docs/plans/2026-10-21-orders-sorting.md.
Use architecture-review:architecture-reviewer on the files changed by that plan.
Use sdd-engineering:plan-verifier on docs/plans/2026-10-21-orders-sorting.md.
```

## 5. Ad hoc research

```
Use research-tools:researcher in project mode: where is pagination implemented, and what is the default page size?
```

## 6. Retrospective

After a multi-agent run, in the same session:

```
/sdd-engineering:workflow-retro
```

It parses this session's own transcript and subagent logs and reports to chat only (tokens per agent, launch order and
parallelism, timing, difficulties, duplicated work, gaps). It writes no files.
