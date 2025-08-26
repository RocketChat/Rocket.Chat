---
"@rocket.chat/meteor": patch
---

fixes an issue where using `/v1/users.updateOwnBasicInfo`, the user was not be able to set the password (not change), even when required
