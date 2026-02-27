---
'@rocket.chat/meteor': patch
---

Migrated statistics API endpoints (`statistics`, `statistics.list`, `statistics.telemetry`) from legacy `API.v1.addRoute` to the new chained `API.v1.get()`/`API.v1.post()` pattern with OpenAPI-compatible AJV response schemas, query/body validation, and `declare module` augmentation for type-safe route registration.
