---
'@rocket.chat/meteor': minor
---

Migrates `ldap.testConnection` and `ldap.testSearch` REST API endpoints from legacy `addRoute` pattern to the new chained `.post()` API pattern with typed response schemas and AJV body validation (replacing Meteor `check()`).
