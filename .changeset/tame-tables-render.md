---
"@rocket.chat/message-parser": minor
---

Adds support for GFM-style tables in the message parser. Tables require a leading and trailing pipe on every row, support column alignment via the delimiter row (`:---`, `:--:`, `---:`), and allow inline markup inside cells (a literal pipe must be escaped as `\|`). New `TABLE`, `TABLE_ROW`, and `TABLE_CELL` AST nodes are emitted. The `TABLE` node also carries an optional `fallback` plain-text node with its raw source, so renderers without table support can degrade to the original markup instead of dropping it.
