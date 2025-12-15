---
'@rocket.chat/model-typings': patch
'@rocket.chat/core-typings': patch
'@rocket.chat/models': patch
'@rocket.chat/meteor': patch
---

Prevents over-assignment of omnichannel agents beyond their max chats limit in microservices deployments by serializing agent assignment with explicit user-level locking.
