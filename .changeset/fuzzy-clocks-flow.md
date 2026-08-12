---
'@rocket.chat/message-parser': patch
---

Fix hour-only timestamps overflowing after the signed 32-bit Unix timestamp boundary.
