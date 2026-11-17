---
'@rocket.chat/meteor': patch
---

Fixes duplicate rooms in the sidebar by normalizing cached record `_id` values to canonical strings when non-string IDs (such as MongoDB ObjectId instances or EJSON binary buffer representations) are received from the server or persistent cache
