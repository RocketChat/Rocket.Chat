---
'@rocket.chat/meteor': patch
---

Fixes `chat.syncThreadsList` and `chat.syncThreadMessages` returning the full content of deleted messages to room members. Their `remove` lists now carry only each message's `_id` and `_deletedAt`.
