---
'@rocket.chat/meteor': patch
'@rocket.chat/models': patch
'@rocket.chat/model-typings': patch
---

Fixes `chat.syncMessages` cursor pagination skipping messages that share the same timestamp at a page boundary. A cursor in the form `<timestamp>_<messageId>` now orders messages by timestamp and then by id. Requests with a timestamp-only cursor keep the previous behavior.
