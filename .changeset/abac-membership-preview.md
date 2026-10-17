---
'@rocket.chat/abac': minor
'@rocket.chat/core-services': minor
'@rocket.chat/core-typings': minor
'@rocket.chat/i18n': minor
'@rocket.chat/meteor': minor
---

Lets users preview, before creating an ABAC-managed room, which of the members they picked will be added and which will be left out. Members whose access cannot be determined are shown separately and are never counted as added. Available through `POST /v1/abac/rooms.evaluateMembership`, which requires the **Create ABAC-managed rooms** permission.
