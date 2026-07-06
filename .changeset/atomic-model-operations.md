---
'@rocket.chat/meteor': patch
'@rocket.chat/core-typings': patch
'@rocket.chat/model-typings': patch
'@rocket.chat/models': patch
---

Fixes race conditions in several check-then-write database flows by collapsing them into single atomic operations: CAS login tokens can no longer be consumed by two concurrent logins, revoking a room invite no longer emits duplicate removal notifications, and deleting an integration now enforces the creator-only permission scope in the delete itself
