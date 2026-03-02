---
'@rocket.chat/rest-typings': patch
'@rocket.chat/meteor': patch
---

Migrated `users.getAvatar`, `users.deleteOwnAccount`, `users.resetAvatar`, and `users.forgotPassword` to explicit `Ajv` schema validation.
