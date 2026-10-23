---
'@rocket.chat/ddp-streamer': patch
---

Fixes the DDP Streamer service not accepting websocket connections when it could not load the client versions at startup, which left every realtime feature unavailable while the service still looked healthy.
