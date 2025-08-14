---
"@rocket.chat/meteor": patch
"@rocket.chat/rest-typings": patch
---

Add OpenAPI support for the Rocket.Chat dm.delete/im.delete API endpoints by migrating to a modern chained route definition syntax and utilizing shared AJV schemas for validation to enhance API documentation and ensure type safety through response validation.
