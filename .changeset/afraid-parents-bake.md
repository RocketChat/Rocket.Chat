---
'@rocket.chat/rest-typings': minor
'@rocket.chat/meteor': minor
---

The REST endpoint /v1/users.createToken is not deprecated anymore. It now requires a secret parameter to generate a token for a user. This change is part of the effort to enhance security by ensuring that tokens are generated with an additional layer of validation. The secret parameter is validated against a new environment variable CREATE_TOKENS_FOR_USERS_SECRET.
