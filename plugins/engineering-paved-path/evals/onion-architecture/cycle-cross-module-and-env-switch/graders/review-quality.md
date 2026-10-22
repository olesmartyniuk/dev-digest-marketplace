---
type: llm
---
PASS only if the final answer satisfies ALL of the following:
- Detects the import cycle rollup/service -> blast/helpers -> rollup/constants
- Flags blast/helpers.ts importing ../rollup/constants.js (cross-module reach) and service importing ../blast/helpers.js
- Flags `new Anthropic` (vendor SDK) constructed inside the service, fix: container.llm()/LLMProvider port
- Flags NODE_ENV==='test' branching with an inline fake, fix: inject mock via ContainerOverrides
- Flags process.env.ANTHROPIC_API_KEY read in the service
- Names the violated layering rules (e.g. no-circular, no-cross-module-reach)

FAIL if any item is missing, or if the answer reports a violation that is not in the code.
