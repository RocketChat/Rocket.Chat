---
'@rocket.chat/meteor': patch
---

Fixes repeated message requests for recursive encrypted quotes. Quote resolution now stops at the configured depth and preserves direct quotes when the configured limit is zero.
