---
'@rocket.chat/meteor': patch
---

Fixed an issue while creating tokens via the special `users.createToken` API was not respecting the maximum login tokens allowed for a user.
