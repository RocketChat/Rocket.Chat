---
'@rocket.chat/meteor': minor
'@rocket.chat/i18n': minor
'@rocket.chat/core-typings': minor
'@rocket.chat/rest-typings': minor
'@rocket.chat/ui-client': minor
---

Adds optional title, nationality and languages fields to the user profile. Users edit them in Account > Profile and admins in the user form; they are validated and saved by the profile and user endpoints, returned by `users.info` and `/v1/me`, and shown in the full profile, with the title also in the user card.
