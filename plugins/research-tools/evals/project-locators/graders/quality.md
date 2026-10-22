---
type: llm
---
PASS if the final report states the retry logic is in `src/retry.ts` and that it makes 3 attempts, and every claim carries a file:line locator.
FAIL if any claim has no locator, or the answer is given from memory without citing the file.
