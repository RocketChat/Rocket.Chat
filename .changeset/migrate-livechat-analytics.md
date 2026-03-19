---
'@rocket.chat/meteor': patch
---

Migrated `livechat/analytics/agent-overview` and `livechat/analytics/overview` GET endpoints from `API.v1.addRoute` to chained `.get()` pattern with AJV response schema validation.
