---
'@rocket.chat/meteor': patch
---

Fixes `$type: 'array'` on local collections not matching a field that is an array, so the same filter selected different documents on the client and on the server
