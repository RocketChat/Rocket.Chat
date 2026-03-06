---
'@rocket.chat/message-parser': patch
---

Fixes ordered list AST generation to preserve `number: 0` for list items that start at index `0`.
