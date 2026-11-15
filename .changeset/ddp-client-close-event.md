---
'@rocket.chat/ddp-client': patch
---

Fixes the heartbeat timers and a pending reconnect timer that kept running after `connection.close()`
