---
'@rocket.chat/meteor': major
'@rocket.chat/core-services': patch
'@rocket.chat/model-typings': patch
'@rocket.chat/core-typings': patch
'@rocket.chat/models': patch
---

Indexes the push token string by storing each token as a flat `tokenValue`/`tokenType` pair, with VoIP tokens now kept in their own document instead of as an extra field on the device token. Changes the `POST /v1/push.token` response to return flat `tokenValue` and `tokenType` fields instead of the nested `token` object.
