---
'@rocket.chat/meteor': minor
'@rocket.chat/models': minor
---

Adds the `USE_ROOM_SEARCH_INDEX` environment variable. When set to `true`, the messages collection's text index is created as `{ rid: 1, msg: 'text' }` instead of the default `{ msg: 'text' }`. The compound shape lets per-room `$text` searches use `rid` as a prefix, dramatically reducing the portion of the index scanned on workspaces where global search is disabled.

The index is reconciled on every startup: if the existing text index already matches the desired shape, nothing happens; otherwise the stale text index is dropped and the desired one is recreated. Unsetting the variable on a later boot reverts to the default shape.
