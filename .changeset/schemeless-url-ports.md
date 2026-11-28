---
'@rocket.chat/message-parser': patch
'@rocket.chat/meteor': patch
---

Fixes links typed without a protocol but with a port, such as `rocket.chat:3000`, being interpreted as custom URL schemes instead of website addresses.
