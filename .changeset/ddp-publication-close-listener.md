---
'@rocket.chat/ddp-streamer': patch
---

Fixes a memory leak in the DDP streamer where every subscription a connection stopped kept a listener until the connection closed, which on long-lived connections with frequent subscription changes led to `MaxListenersExceededWarning` and eventually an out-of-memory crash
