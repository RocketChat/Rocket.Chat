---
'@rocket.chat/ddp-server': patch
'@rocket.chat/ddp-streamer': patch
---

Fixes a memory leak in the DDP streamer where a client that disconnected while a stream subscription was still being set up left that subscription's listeners behind, and later events were still sent to the closed connection
