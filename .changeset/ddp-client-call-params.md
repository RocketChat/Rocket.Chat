---
'@rocket.chat/ddp-client': patch
---

Fixes `client.call()` and `client.callWithOptions()` sending `[null]` as the parameters of a call made without parameters or callback
