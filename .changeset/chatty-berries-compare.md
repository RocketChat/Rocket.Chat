---
'@rocket.chat/rest-typings': patch
'@rocket.chat/meteor': patch
---

Restores `roomName` property in the `GET /groups.messages` endpoint to fix unintended removal.
