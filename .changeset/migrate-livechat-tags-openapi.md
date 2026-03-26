---
'@rocket.chat/meteor': minor
'@rocket.chat/rest-typings': minor
---

Migrates `livechat/tags` and `livechat/tags/:tagId` REST API endpoints from legacy `addRoute` pattern to the new chained `.get()` API pattern with typed response schemas and AJV query validation.
