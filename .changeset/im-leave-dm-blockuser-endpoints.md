---
'@rocket.chat/meteor': patch
'@rocket.chat/rest-typings': patch
---

Adds the missing `im.leave`/`dm.leave` and `dm.blockUser` REST endpoints. The `/v1/im.leave` type had been declared and the deprecated `leaveRoom` DDP method pointed clients at it, but no server route implemented it; likewise `im.blockUser` shipped without its `dm.blockUser` alias. All new routes delegate to the same shared server functions as their existing counterparts.
