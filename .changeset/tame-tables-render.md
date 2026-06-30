---
"@rocket.chat/message-parser": minor
---

Adds support for GFM-style tables in the message parser. Tables require a leading and trailing pipe on every row, support column alignment via the delimiter row (`:---`, `:--:`, `---:`), and allow inline markup inside cells (a literal pipe must be escaped as `\|`). New `TABLE`, `TABLE_ROW`, and `TABLE_CELL` AST nodes are emitted. The `TABLE` node also carries an optional `fallback` — a `[start, end]` offset span into the original source — so renderers without table support can slice the source to show the raw markup instead of dropping it, without duplicating the text into the AST.
