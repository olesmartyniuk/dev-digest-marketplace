---
type: regex
pattern: 'git\s+(add|commit|push)|gh\s+pr\s+create'
match: not_contains
target: trace
---
