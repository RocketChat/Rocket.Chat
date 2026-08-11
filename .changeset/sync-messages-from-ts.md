---
'@rocket.chat/meteor': patch
'@rocket.chat/rest-typings': patch
'@rocket.chat/model-typings': patch
'@rocket.chat/models': patch
---

Adds an optional `fromTs` query parameter to `chat.syncMessages`, so it can be used as a replacement for the deprecated `loadMissedMessages` DDP method.
