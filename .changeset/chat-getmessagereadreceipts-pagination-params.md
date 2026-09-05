---
'@rocket.chat/rest-typings': patch
'@rocket.chat/meteor': patch
---

Fix `chat.getMessageReadReceipts` endpoint schema validation failing when `offset` and `count` pagination query parameters are passed.
