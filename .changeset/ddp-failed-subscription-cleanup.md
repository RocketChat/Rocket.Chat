---
'@rocket.chat/ddp-streamer': patch
---

Fixes a memory leak in the DDP streamer where every subscription that failed to start stayed registered on its connection until the connection closed
