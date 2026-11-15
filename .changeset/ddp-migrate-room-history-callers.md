---
'@rocket.chat/meteor': patch
---

Deprecates the `loadHistory` and `loadNextMessages` real-time API methods in favor of the new `GET /v1/rooms.history` endpoint. Both methods keep working until they are removed in 9.0.0.
