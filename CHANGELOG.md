# Changelog

All notable changes per plugin. Versions follow semver and match `plugin.json`.

## engineering-paved-path

### 1.0.0
- Initial release: skills `react-best-practices`, `react-frontend-best-practices`, `next-best-practices`, `fastify-best-practices`, `onion-architecture`, `react-testing-library`, `security`, with `claude plugin eval` cases.

## research-tools

### 1.0.0
- Initial release: read-only `researcher` agent (project or web mode, locator for every claim).

## architecture-review

### 1.0.0
- Initial release: read-only `architecture-reviewer` agent with a closed rule catalogue.

## sdd-engineering

### 1.0.0
- Initial release: agents `spec-creator`, `implementation-planner`, `implementer`, `plan-verifier`; skills `run-plan`, `workflow-retro`.
- Depends on `engineering-paved-path`, `research-tools`, `architecture-review` (`^1.0.0`).
