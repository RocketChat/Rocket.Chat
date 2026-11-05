---
'@rocket.chat/meteor': patch
---

Fixes `roles.removeUserFromRole` ignoring the documented `roomId` parameter, so removing a user from a room-scoped role failed with `error-user-not-in-role`
