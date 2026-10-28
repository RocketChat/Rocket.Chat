---
'@rocket.chat/meteor': patch
---

Fixes `chat.sendMessage` and `chat.postMessage` keeping markdown trees (`md`, `descriptionMd`) that the caller put inside message attachments
