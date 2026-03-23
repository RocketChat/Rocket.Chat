---
'@rocket.chat/meteor': minor
'@rocket.chat/rest-typings': minor
---

Migrates `livechat/agent.info/:rid/:token` and `livechat/agent.next/:token` REST API endpoints from legacy `addRoute` pattern to the new chained `.get()` API pattern with typed response schemas and AJV validation.
