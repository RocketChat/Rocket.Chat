---
'@rocket.chat/ddp-client': patch
---

Fixes the login token expiry becoming an invalid date when the client decodes EJSON, and `loginWithToken` resolving with the raw server result instead of its declared `{ id, token, tokenExpires: Date }`
