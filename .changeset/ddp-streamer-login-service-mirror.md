---
'@rocket.chat/ddp-streamer': patch
---

Fixes login service configuration changes being lost by the DDP Streamer service when no client was subscribed at the moment of the change, which left newly connected clients with an outdated list of login services until the next change or a restart.
