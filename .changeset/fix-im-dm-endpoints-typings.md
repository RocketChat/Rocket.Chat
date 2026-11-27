---
'@rocket.chat/rest-typings': patch
'@rocket.chat/meteor': patch
---

Fixes `im.messages.others`, `im.list`, and `im.list.everyone` (and `dm.*` aliases) parameter types to accept required `roomId` and supported pagination query options
