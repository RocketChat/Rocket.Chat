---
'@rocket.chat/meteor': patch
---

Fixes livechat navigation history for visitors without a room never expiring: 'expireAt' was stored as a number instead of an ISODate. Mongo expects ISODate for expiry fields. Existing documents are converted by migration v336.
