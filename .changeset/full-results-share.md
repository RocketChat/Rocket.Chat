---
'@rocket.chat/presence-service': patch
'@rocket.chat/core-services': patch
'@rocket.chat/model-typings': patch
'@rocket.chat/core-typings': patch
'@rocket.chat/presence': patch
'@rocket.chat/models': patch
---

Adds the backend foundation for a unified presence engine with a priority-based claim system (internal > manual > external), status expiration, and previous state restore.
