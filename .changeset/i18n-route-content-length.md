---
'@rocket.chat/meteor': patch
---

Fixes translation files for languages with non-ASCII characters being served with a `Content-Length` shorter than the response, which could cut them off for clients that don't receive a compressed response
