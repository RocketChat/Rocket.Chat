---
'@rocket.chat/ddp-client': patch
'@rocket.chat/meteor': patch
---

Fixes the web client not reconnecting the WebSocket on its own after the server drops it when the SDK DDP transport is enabled; it now keeps retrying (capped at 30s between attempts) instead of giving up after a single retry
