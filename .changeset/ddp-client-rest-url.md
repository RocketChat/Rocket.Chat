---
'@rocket.chat/ddp-client': patch
---

Fixes `sdk.rest` calls failing when the SDK is created with a `ws(s)://` URL, and the socket path doubling when the URL already ends with `/websocket`
