---
'@rocket.chat/core-services': major
'@rocket.chat/core-typings': major
'@rocket.chat/rest-typings': major
'@rocket.chat/ddp-client': major
'@rocket.chat/meteor': major
---

Removes the deprecated `query` and `fields` REST API parameters, along with the `ALLOW_UNSAFE_QUERY_AND_FIELDS_API_PARAMS` environment variable that re-enabled them. Deprecated in 6.3.0 and disabled by default since 7.0.0, they let callers run raw MongoDB queries and projections against the database.

Endpoints that validate their query string now reject both with `400 error-invalid-params` instead of ignoring them; the few without validation keep accepting and ignoring them. `channels.online` and `groups.online` now require `_id`. On `users.list`, fields outside the default projection — `customFields`, `utcOffset`, `nickname`, `bio`, `statusText`, `federated` and `freeSwitchExtension` — are no longer reachable in bulk; use `users.info` instead. Callers should move to the dedicated filter parameters each endpoint exposes, such as `name`, `type`, `_id` and `text`.