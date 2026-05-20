---
"@rocket.chat/meteor": patch
---

Fixes an issue that allowed a room converted from private to public (while abac is disabled) to retain its abac attributes (if any)
