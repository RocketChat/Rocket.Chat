---
'@rocket.chat/meteor': patch
---

Improve login protection by deduplicating repeated lockout notifications within the same block window and by not persisting blocked-by-IP retries as new failed-login-attempt events.
