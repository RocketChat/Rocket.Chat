---
'@rocket.chat/core-typings': minor
'@rocket.chat/i18n': minor
'@rocket.chat/meteor': minor
'@rocket.chat/model-typings': minor
'@rocket.chat/models': minor
'@rocket.chat/rest-typings': minor
---

Adds admin control over per-user status visibility (Enterprise only). From **Administration > Status and presence > User status**, an admin can hide a user's status from a list of named individuals without disabling their status entirely, review existing rules in a table, and remove a rule through a confirmation dialog. The same controls are available while editing a user. The hidden usernames are stored in the new `statusVisibilityDeniedByAdmin` field, set through a matching parameter on `POST /v1/users.update`, listed through the new `GET /v1/users.listStatusVisibility` endpoint, and returned by `GET /v1/users.info` to callers with `view-full-other-user-info`.
