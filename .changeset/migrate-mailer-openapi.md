---
'@rocket.chat/meteor': patch
'@rocket.chat/rest-typings': patch
---

Migrated `mailer` and `mailer.unsubscribe` REST API endpoints from deprecated `addRoute` pattern to new chainable `.post()` pattern with inline AJV response schemas, enabling automatic OpenAPI 3.0.3 documentation generation.
