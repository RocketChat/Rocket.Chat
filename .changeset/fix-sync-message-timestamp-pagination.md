---
'@rocket.chat/meteor': patch
'@rocket.chat/models': patch
'@rocket.chat/rest-typings': patch
---

Fix `chat.syncMessages` skipping updated or deleted messages that share a timestamp at a pagination boundary. Timestamp cursors remain compatible with existing clients; pages may exceed `count` to include the complete boundary timestamp group. Deleted messages are now ordered by their deletion timestamp. Add a room/update-timestamp index to support streaming sync queries.
