---
"@rocket.chat/meteor": patch
"@rocket.chat/core-services": patch
---

Fixed a problem that caused OTR Session messages' to not being transmitted from one peer to another when running Rocket.Chat as microservices. This was caused by a legacy streamer that tried to use the websocket directly, which works on monolith but doesn't on microservices, cause these events are routed through DDP Streamer service.
