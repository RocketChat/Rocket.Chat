---
"@rocket.chat/meteor": patch
"@rocket.chat/rest-typings": patch
---

Migrated `integrations.*` REST API endpoints from the deprecated `API.v1.addRoute()` pattern to the new chained router API (`API.v1.get().post().put()`). This migration:

- Replaces all 6 `addRoute` calls with chained `.get()`, `.post()`, and `.put()` calls
- Removes the inline `check()` call from `integrations.remove` in favor of type-safe validator guard
- Adds AJV response schemas for all 6 endpoints (200/400/401/403 responses)
- Moves the endpoint type declarations from the centralized `rest-typings` `Endpoints` interface into a `declare module` block in the route file, making the route file the single source of truth
- Enables automatic OpenAPI documentation generation for all integration endpoints
