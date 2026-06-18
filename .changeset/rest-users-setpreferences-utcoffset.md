---
'@rocket.chat/rest-typings': minor
'@rocket.chat/meteor': minor
---

`POST /v1/users.setPreferences` now accepts an optional `data.utcOffset` (number) field. The value is stored at the user-document root via `Users.setUtcOffset` (not under `settings.preferences`), matching what the legacy `userSetUtcOffset` DDP method did.
