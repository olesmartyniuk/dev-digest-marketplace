---
name: security-trigger
tags: [trigger]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
---
Review this Express handler for security problems: it builds a SQL string from req.query.id, stores a JWT secret in the source file and accepts any file upload.
