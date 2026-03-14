---
'@rocket.chat/meteor': patch
'@rocket.chat/rest-typings': patch
---

Migrates all four `subscriptions.*` REST API endpoints (`subscriptions.get`, `subscriptions.getOne`, `subscriptions.read`, `subscriptions.unread`) from the legacy `API.v1.addRoute` pattern to the new chained `API.v1.get()`/`API.v1.post()` pattern with AJV response schema validation and OpenAPI support.
