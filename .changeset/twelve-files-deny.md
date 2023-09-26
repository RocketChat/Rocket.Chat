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

feat new `package/jwt` with `sign` and `veriy` functions to create a JWT given a JS object. By default uses algorithm RS256 for the public/private keys.
feat new `ee/package/license`. Contains new V3 definition and previous License definition renamed as LicenseV2. Package handles both versions.
