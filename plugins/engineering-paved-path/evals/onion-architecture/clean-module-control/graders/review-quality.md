---
type: llm
---
PASS only if the final answer satisfies ALL of the following:
- Does not report any CRITICAL or HIGH layering violation (no false positives on severity)
- States that the module follows the routes -> service -> repository layering / is fine architecturally
- Does not demand moving SQL, helpers or constants that are already in the right place
- Any raised nit is factually correct about the code (e.g. unused exists(), no invented imports)
- Does not recommend a large restructure of the module

FAIL if any item is missing, or if the answer reports a violation that is not in the code.
