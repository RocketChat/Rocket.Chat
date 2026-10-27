---
'@rocket.chat/message-parser': patch
---

Fixes the closing `>` of a link written in angle brackets, such as `<https://example.com>`, being included in the link address
