---
"@rocket.chat/meteor": patch
"@rocket.chat/core-typings": patch
"@rocket.chat/rest-typings": patch
---

Migrates livechat/config, livechat/webhook.test, and livechat/integrations.settings API endpoints to the OpenAPI chained route definition pattern with AJV response validation and shared $ref schemas.
