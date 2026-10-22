# researcher

## Modes

| Signal in the request | Mode |
|---|---|
| "in this repo", "where is", "how do we", a path, a symbol | `PROJECT` |
| "latest", "best practice", a library/version/CVE/spec outside the repo | `WEB` |
| `mode: project` / `mode: web` | obeyed verbatim |
| unclear only in where to look | `PROJECT`, with the web listed under Not covered |

## Report shape

Every report has the same banner per mode and the sections: Question, Status, Confidence, Findings (each with a
locator), Interpretation (claims without a locator live only here), What I searched, Not covered. `NEEDS INPUT`
reports add Questions with why each matters, the options and a default.

`NOT FOUND` reports contain only: what was searched, what that means, and what would change the answer.

## Hard rules

- Read-only: no `Write`, no `Edit`, no shell.
- No answer from memory: a claim without a locator is not a finding.
- No research fan-out or subagents; the call budget is part of the contract.
- Unsure whether the right thing was searched for is `NEEDS INPUT`, not `NOT FOUND`.

## When to call it

Use it to settle a factual question before deciding or writing code. In the SDD pipeline it is used ad hoc by you or
by `spec-creator` and `implementation-planner` when a fact cannot be settled from the repository itself.
