---
'@rocket.chat/meteor': patch
---

Adds the missing room access check to the `e2e.fetchUsersWaitingForGroupKey` endpoint, so it only returns results for the rooms the caller can access
