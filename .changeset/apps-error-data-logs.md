---
'@rocket.chat/apps': patch
'@rocket.chat/meteor': patch
---

Fix Apps runtime error responses failing on primitive or frozen error data and losing request logs when error data is an array.
