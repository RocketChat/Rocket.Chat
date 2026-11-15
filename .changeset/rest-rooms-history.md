---
'@rocket.chat/rest-typings': minor
'@rocket.chat/meteor': minor
---

Adds a new `GET /v1/rooms.history` endpoint to load a room's message history. Unlike the existing `channels.history`, `groups.history`, `im.history` and `dm.history` endpoints, it works with any room type through a single route, and can be used to read public channels anonymously when `Accounts_AllowAnonymousRead` is enabled.
