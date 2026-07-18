---
'@rocket.chat/rest-typings': minor
'@rocket.chat/meteor': minor
---

Migrates the `getRoomByTypeAndName` DDP method to REST. Adds `GET /v1/rooms.getByTypeAndName` (query `{ type, name }` → `{ room }`, `authRequired: false` to keep supporting anonymous read). The open-room flow and the embedded preload now use it; the DDP method keeps its registration with a deprecation log pointing at the new route until 9.0.0. The URL scheme is unchanged (still type + name) — this only moves the resolution off DDP.
