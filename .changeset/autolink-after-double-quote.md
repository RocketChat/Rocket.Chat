---
'@rocket.chat/message-parser': patch
---

Fixes URLs written right after a double quote, such as `"https://example.com"`, not being turned into links
