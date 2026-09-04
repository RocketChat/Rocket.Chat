---
"@rocket.chat/rest-typings": patch
"@rocket.chat/meteor": patch
---

Extract inline Ajv schemas from `users.getAvatar`, `users.deleteOwnAccount`, `users.resetAvatar`, and `users.forgotPassword` REST endpoints into typed params files in `@rocket.chat/rest-typings` for consistent schema validation.
