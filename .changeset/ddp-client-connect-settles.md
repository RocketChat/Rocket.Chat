---
'@rocket.chat/ddp-client': patch
---

Fixes `connection.connect()` never settling when the socket closes before the DDP handshake, and the process crashing on an unreachable server when the `ws` package provides `WebSocket`
