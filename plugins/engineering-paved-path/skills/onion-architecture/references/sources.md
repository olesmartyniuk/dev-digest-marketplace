# Sources

- [Onion Architecture — Jeffrey Palermo (original definition)](https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/) — the original concentric-rings formulation: domain model at the center, "nothing in an inner circle can know anything at all about something in an outer circle."
- [Clean vs Onion vs Hexagonal Architecture — Milan Jovanović](https://milanjovanovic.tech/blog/clean-architecture-vs-onion-vs-hexagonal) — clear layer definitions (domain model → domain services → application services → infrastructure) and the shared dependency rule across all three styles; used for this skill's "one invariant" framing.
- [Onion Architecture in Node.js with TypeScript — Sankhadip Samanta](https://sankhadip.medium.com/onion-architecture-in-node-js-with-typescript-5508612a4391) — Node/TS-specific layering (UI / core / infrastructure) and dependency-injection wiring, close to the container/composition-root approach used here.
- [Taking Frontend Architecture Serious With Dependency-cruiser — Xebia](https://xebia.com/blog/taking-frontend-architecture-serious-with-dependency-cruiser/) — using dependency-cruiser as an "architecture fitness function" rather than a one-off lint pass.
- [dependency-cruiser rules-reference](https://github.com/sverweij/dependency-cruiser/blob/main/doc/rules-reference.md) — exact `forbidden` rule shape, `path`/`pathNot`, and the `$1` capture-group backreference useful for a cross-module-reach rule.
- [dependency-cruiser CLI docs](https://github.com/sverweij/dependency-cruiser/blob/main/doc/cli.md) — `--ignore-known` / `depcruise-baseline` (the "freeze existing drift, fail only on new violations" mechanism the enforcement section relies on).

## Provenance of the module layout

The routes → service → repository → adapters layout, the container as composition root, and the "no SQL outside the repository, no HTTP outside routes, no literals outside constants" convention are a common Node/TypeScript backend convention. This skill names the pattern and makes it mechanically enforceable; it does not introduce a new structure.
