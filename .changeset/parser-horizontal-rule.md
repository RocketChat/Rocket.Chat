---
"@rocket.chat/message-parser": minor
"@rocket.chat/gazzodown": minor
---

Adds support for horizontal rules (thematic breaks) in the message parser. A line of 3 or more contiguous dashes (`---`, with nothing else on the line) is parsed into a new `HORIZONTAL_RULE` block node and rendered with Fuselage's `Divider`. The node carries an optional `fallback` — a `[start, end]` offset span into the original source — so renderers without horizontal-rule support can slice the source to show the raw markup instead of dropping it, without duplicating the text into the AST. Only `-` is accepted: CommonMark also allows `*` and `_`, but those collide with emphasis and with censored words (bad-words masks a term as a run of `*`), so a bare `***` / `_______` line stays text/emphasis instead of becoming a divider.
