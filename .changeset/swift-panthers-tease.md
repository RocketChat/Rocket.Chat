---
"@rocket.chat/meteor": patch
"@rocket.chat/core-typings": patch
"@rocket.chat/rest-typings": patch
---

Removed upsert behavior on `users.update` endpoint (`joinDefaultChannels` param or empty `userId` are not allowed anymore)
