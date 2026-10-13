---
'@rocket.chat/abac': minor
'@rocket.chat/core-services': minor
'@rocket.chat/core-typings': minor
'@rocket.chat/i18n': minor
'@rocket.chat/meteor': minor
---

Adds `POST /v1/abac/rooms.evaluateMembership`, which tells a room creator, before the room exists, which of the members they picked will be added once ABAC attributes are set. The creator is counted, and a creator who would not be admitted is refused as at creation, unless the request leaves them out with `excludeSelf`. Members the Policy Decision Point can neither permit nor deny are reported as undetermined rather than compliant, and a preview never reports anyone as compliant when access decisions are unavailable. It accepts only attributes the creator could set on the room, requires the **Create ABAC-managed rooms** permission, and checks at most `API_User_Limit` members at once.
