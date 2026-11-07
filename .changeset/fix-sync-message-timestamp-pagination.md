---
'@rocket.chat/meteor': patch
'@rocket.chat/models': patch
'@rocket.chat/model-typings': patch
'@rocket.chat/rest-typings': patch
---

Fix `chat.syncMessages` skipping updates or deletions with tied timestamps using bounded timestamp/ID cursor pagination. Numeric starting timestamps remain accepted; clients must pass returned opaque cursors back unchanged. Pages no longer expand to include whole timestamp groups. Add a room/update-timestamp/ID index and sort deletions by their deletion timestamp.
