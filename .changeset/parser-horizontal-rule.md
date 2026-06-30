---
"@rocket.chat/message-parser": minor
"@rocket.chat/gazzodown": minor
---

Adds support for horizontal rules (thematic breaks) in the message parser. A line of 3 or more contiguous `-`, `*`, or `_` markers (with nothing else on the line) is parsed into a new `HORIZONTAL_RULE` block node and rendered with Fuselage's `Divider`. The node carries an optional `fallback` — a `[start, end]` offset span into the original source — so renderers without horizontal-rule support can slice the source to show the raw markup instead of dropping it, without duplicating the text into the AST. Spaced variants like `* * *` are intentionally not matched, to preserve the existing whitespace-emphasis behavior of `** **` / `__ __`.
