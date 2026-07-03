---
"@rocket.chat/gazzodown": patch
---

Degrades blocks without a dedicated renderer to their raw markup instead of dropping them. When a block carries a `fallback` `[start, end]` offset span, `Markup`/`PreviewMarkup` slice the original message source (passed via the new optional `source` prop) and render that text. This avoids duplicating the markup into the AST while keeping unsupported blocks visible.
