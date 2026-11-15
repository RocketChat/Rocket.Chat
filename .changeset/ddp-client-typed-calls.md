---
'@rocket.chat/ddp-client': patch
---

Fixes `client.callAsync` and `client.callAsyncWithOptions` returning `any` for the methods declared in `ServerMethods`; they now resolve with the declared return type
