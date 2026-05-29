---
'@rocket.chat/rest-typings': minor
'@rocket.chat/meteor': minor
---

Added `GET /v1/rooms.getByTypeAndName` (replaces the deprecated `getRoomByTypeAndName` DDP method). Query params `{ type, name }`; not auth-gated so anonymous-read flows for public channels keep working (`Accounts_AllowAnonymousRead`). The legacy DDP method remains registered with a deprecation log pointing at the new route.
