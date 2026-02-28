---
"@rocket.chat/meteor": patch
"@rocket.chat/rest-typings": patch
---

Migrates the `roles.list` REST API endpoint from the legacy `API.v1.addRoute` pattern to the new chained `API.v1.get()` pattern with AJV response schema validation and OpenAPI documentation support.
