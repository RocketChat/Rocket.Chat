---
'@rocket.chat/core-typings': minor
'@rocket.chat/meteor': minor
---

Adds a `multiLookup` setting type, the multi-value counterpart of `lookup`, for settings whose options are workspace data rather than a list fixed at registration time. A value already stored on the setting stays selectable and removable after its option disappears from the source, so a setting can never be left holding a value the admin area cannot clear.
