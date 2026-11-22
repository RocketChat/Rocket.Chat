---
'@rocket.chat/meteor': patch
'@rocket.chat/core-typings': patch
'@rocket.chat/model-typings': patch
'@rocket.chat/models': patch
'@rocket.chat/rest-typings': patch
'@rocket.chat/i18n': patch
---

Adds the "Delete original discussion messages" retention policy setting. When it is off and "Do not prune discussion messages" is on, the prune keeps the message that starts each discussion, and its files. This applies to discussions that start after the update. When the prune deletes the file of a discussion's first message, quotes of that message in the discussion now show "File deleted".
