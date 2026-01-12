---
'@rocket.chat/model-typings': patch
'@rocket.chat/models': patch
'@rocket.chat/meteor': patch
---

Fixes /v1/users.logout not marking user sessions as logged out, leaving stale sessions active.
