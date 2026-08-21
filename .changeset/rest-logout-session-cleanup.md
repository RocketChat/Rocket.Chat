---
'@rocket.chat/meteor': patch
---

Marks the user session as logged out in the Sessions collection when logging out via `POST /v1/logout`. Previously the session cleanup relied on an indirect chain through `watch.users` → `Accounts.onLogout` that could be broken by a race condition, leaving orphaned sessions visible in Device Manager.
