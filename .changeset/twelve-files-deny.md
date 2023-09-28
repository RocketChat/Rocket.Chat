---
'@rocket.chat/license': minor
'@rocket.chat/jwt': minor
'@rocket.chat/omnichannel-services': minor
'@rocket.chat/omnichannel-transcript': minor
'@rocket.chat/authorization-service': minor
'@rocket.chat/stream-hub-service': minor
'@rocket.chat/presence-service': minor
'@rocket.chat/account-service': minor
'@rocket.chat/core-services': minor
'@rocket.chat/model-typings': minor
'@rocket.chat/core-typings': minor
'@rocket.chat/rest-typings': minor
'@rocket.chat/ddp-streamer': minor
'@rocket.chat/queue-worker': minor
'@rocket.chat/presence': minor
'@rocket.chat/meteor': minor
---

Implemented the License library, it is used to handle the functionality like expiration date, modules, limits, etc.
Also added a version v3 of the license, which contains an extended list of features.
v2 is still supported, since we convert it to v3 on the fly.
