---
'@rocket.chat/mongo-adapter': patch
---

Fixes client-side updates to a nested field whose name contains a digit, such as `settings.v2`, failing when the parent field does not exist yet
