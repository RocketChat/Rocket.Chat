---
"@rocket.chat/message-parser": minor
"@rocket.chat/gazzodown": minor
---

Adds support for horizontal rules (thematic breaks) in the message parser. A line of 3 or more contiguous `-`, `*`, or `_` markers (with nothing else on the line) is parsed into a new `HORIZONTAL_RULE` block node and rendered with Fuselage's `Divider`. Spaced variants like `* * *` are intentionally not matched, to preserve the existing whitespace-emphasis behavior of `** **` / `__ __`.
