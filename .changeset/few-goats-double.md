---
'@rocket.chat/core-services': minor
'@rocket.chat/core-typings': minor
'@rocket.chat/i18n': minor
'@rocket.chat/meteor': minor
'@rocket.chat/model-typings': minor
'@rocket.chat/models': minor
'@rocket.chat/presence': minor
'@rocket.chat/rest-typings': minor
---

Adds admin control over user status (Enterprise only): from **Administration > Status and presence**, or while editing a user, an admin can turn someone's status off or hide it from chosen people, and a **Show status** setting turns status off for the whole workspace. A user whose status is turned off always appears offline and can no longer change it; a user who is only hidden from chosen people keeps control of their own status. The feature is off by default, behind the new **Admin status hiding** setting.
