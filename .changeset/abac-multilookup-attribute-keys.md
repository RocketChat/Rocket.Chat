---
'@rocket.chat/core-typings': minor
'@rocket.chat/model-typings': minor
'@rocket.chat/core-services': minor
'@rocket.chat/models': minor
'@rocket.chat/abac': minor
'@rocket.chat/meteor': minor
---

Adds a `multiLookup` setting type, the multi-value counterpart of `lookup`, for settings whose options are workspace data rather than a list fixed at registration time. A value already stored on the setting stays selectable and removable after its option disappears from the source, so a setting can never be left holding a value the admin area cannot clear.

Adds `GET /v1/abac/attribute-keys`, which returns the workspace's ABAC attribute keys and is the option source for such a setting.
