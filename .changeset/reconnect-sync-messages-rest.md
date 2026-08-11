---
'@rocket.chat/models': patch
'@rocket.chat/meteor': patch
---

Fixes reconnect message sync missing edits and deletions made while offline. The client now uses `GET /v1/chat.syncMessages` (anchored on `_updatedAt`) instead of the legacy `loadMissedMessages` DDP method, which only checked `ts` and never reported deletions. Also adds a `{ rid: 1, _updatedAt: 1 }` index on the `message` collection to keep the endpoint fast on reconnect.
