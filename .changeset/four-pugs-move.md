---
'@rocket.chat/meteor': patch
---

Prevent a bug that caused all sessions being marked as logged out if some required value was missing due to a race condition.
