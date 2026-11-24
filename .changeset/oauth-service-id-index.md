---
'@rocket.chat/model-typings': patch
'@rocket.chat/models': patch
'@rocket.chat/meteor': patch
---

Fixes OAuth login services no longer getting the unique index on the service id of their users, which left every OAuth login scanning the users collection and allowed duplicate users for the same external account
