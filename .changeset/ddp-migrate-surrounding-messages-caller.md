---
'@rocket.chat/meteor': patch
---

Deprecates the `loadSurroundingMessages` real-time API method in favor of the `aroundId` parameter of `GET /v1/rooms.history`. The method keeps working until it is removed in 9.0.0.
