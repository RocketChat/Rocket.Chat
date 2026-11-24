---
'@rocket.chat/meteor': patch
---

Fixes a `TypeError` when an app uploads a file through `UploadCreator.uploadBuffer` and the file name has no known extension
