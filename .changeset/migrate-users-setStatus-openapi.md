---
"@rocket.chat/meteor": minor
"@rocket.chat/rest-typings": minor
---

Migrates the `users.setStatus` REST API endpoint from the legacy `API.v1.addRoute` pattern to the new chained `API.v1.post()` pattern with AJV request body and response schema validation and OpenAPI documentation support.
