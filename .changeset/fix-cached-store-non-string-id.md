---
'@rocket.chat/meteor': patch
---

Fixes duplicate rooms appearing in the sidebar when a subscription or room has a non-string _id (such as a BSON ObjectId or EJSON binary)
