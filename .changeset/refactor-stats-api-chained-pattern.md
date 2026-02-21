---
'@rocket.chat/meteor': patch
---

Migrated `statistics`, `statistics.list`, and `statistics.telemetry` REST API endpoints from legacy `addRoute` pattern to the new chained `.get()`/`.post()` API pattern with typed response schemas and AJV query parameter validation.
