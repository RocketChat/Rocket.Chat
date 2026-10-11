---
'@rocket.chat/meteor': patch
'@rocket.chat/ddp-streamer': patch
'@rocket.chat/core-services': patch
---

Fixes real-time updates emitted by the main Rocket.Chat process never reaching clients in microservices deployments, such as canned response changes, import progress, integration history clearing and typing indicators from apps, and stops the DDP Streamer service from delivering typing and other client-sent events twice to clients on the same instance and back to their sender.
