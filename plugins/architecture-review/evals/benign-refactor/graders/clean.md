---
type: llm
---
PASS only if the report satisfies ALL of the following:
- Reports no numbered findings (or only clearly non-blocking observations under "Not covered") for the benign local-variable rename
- Does not invent a layering-rule violation where the diff violates none
- Final Status is CLEAN, or PARTIAL only because no architecture check could be run (no architecture check configured) — never VIOLATIONS
FAIL otherwise.
