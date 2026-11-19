---
'@rocket.chat/meteor': patch
---

Fixes an issue where apps did not get the complete `IUser` object for the `IPostUserDeleted` event when an admin deleted an user
