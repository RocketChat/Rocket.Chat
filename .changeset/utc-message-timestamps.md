---
'@rocket.chat/message-parser': patch
'@rocket.chat/meteor': patch
---

Fixes UTC timestamps such as `<t:2025-07-22T10:00:00Z>` appearing as plain text in messages.
