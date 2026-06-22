---
"@rocket.chat/meteor": minor
"@rocket.chat/rest-typings": minor
---

Added a new `rooms.join` REST endpoint that lets a user join any room type, replicating the behavior of the deprecated `joinRoom` DDP method. Unlike `channels.join`, it resolves all room types through the shared `Room.join` service (access checks, join codes, federation and omnichannel rules). The client now uses `rooms.join` instead of `channels.join`.
