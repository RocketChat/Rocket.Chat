---
'@rocket.chat/meteor': minor
'@rocket.chat/rest-typings': minor
---

Adds an optional `fromTs` query parameter to `chat.syncMessages`, so it can be used as a replacement for the deprecated `loadMissedMessages` DDP method. It bounds the sync window and must be used together with `lastUpdate`; sending it with cursor pagination is rejected instead of being ignored.
