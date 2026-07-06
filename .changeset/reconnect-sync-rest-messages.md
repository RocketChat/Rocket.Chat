---
'@rocket.chat/models': minor
'@rocket.chat/meteor': minor
---

Reconnect message synchronization now uses the `chat.syncMessages` REST endpoint instead of the `loadMissedMessages` DDP method, so edits and deletions that happened while the client was offline are reconciled once the connection is restored. Adds a `{ rid: 1, _updatedAt: 1 }` index to the messages collection to keep that query efficient on large rooms and deprecates the `loadMissedMessages` method, planned for removal in 9.0.0.
