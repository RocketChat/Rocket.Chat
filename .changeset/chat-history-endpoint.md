---
'@rocket.chat/meteor': minor
'@rocket.chat/rest-typings': minor
---

Adds a new `chat.history` REST endpoint that fetches a room's message history by `roomId` regardless of room type (channel, private group or DM), mirroring the behavior of `channels.history`/`groups.history`/`im.history` without requiring the caller to know the room type beforehand
