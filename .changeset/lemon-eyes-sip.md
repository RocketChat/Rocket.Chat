---
"@rocket.chat/meteor": major
"@rocket.chat/core-typings": major
"@rocket.chat/rest-typings": minor
"@rocket.chat/model-typings": major
"@rocket.chat/models": major
"@rocket.chat/ui-client": major
"@rocket.chat/ui-voip": minor
"@rocket.chat/i18n": minor
"@rocket.chat/livechat": patch
---

Adds support for registering multiple phone numbers with labels per user. **Breaking:** the `phone` user field is replaced by the `phones` array (`{ number, label? }[]`); existing numbers are migrated automatically on upgrade.
