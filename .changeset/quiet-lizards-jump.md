---
'@rocket.chat/meteor': patch
---

Ensures the `users.CreateToken` endpoint checks for the `user-generate-access-token` permission when generating a login token for another user
