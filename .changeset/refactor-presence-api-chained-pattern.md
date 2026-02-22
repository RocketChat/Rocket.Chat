---
'@rocket.chat/meteor': patch
---

Migrated `presence.getConnections` and `presence.enableBroadcast` REST API endpoints from legacy `addRoute` pattern to the new chained `.get()`/`.post()` API pattern with typed response schemas.
