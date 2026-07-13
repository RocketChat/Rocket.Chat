---
"@rocket.chat/message-parser": patch
---

Fixes code fences failing to render when a line inside them ends with an inline-code backtick (e.g. `` - **Node**: `22.22.3` ``). A trailing backtick immediately before a line break could not be consumed as content, causing the whole ```` ``` ```` block to fall back to markdown parsing and split apart. Trailing 1-2 backticks before a line end (or EOF) are now treated as code content.
