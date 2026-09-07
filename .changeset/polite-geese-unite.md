---
'@rocket.chat/core-services': minor
'@rocket.chat/core-typings': minor
'@rocket.chat/i18n': minor
'@rocket.chat/model-typings': minor
'@rocket.chat/models': minor
'@rocket.chat/presence': minor
'@rocket.chat/rest-typings': minor
'@rocket.chat/meteor': minor
---

Adds admin control over user status visibility (Enterprise only). The new **User status** setting (`Accounts_UserStatus_Enabled`) hides everyone's status workspace-wide, and a per-user toggle in **Admin → Users** does the same for a single user through `presenceDisabledByAdmin` on `users.create` and `users.update`. Affected users always appear offline and can no longer change their own status.