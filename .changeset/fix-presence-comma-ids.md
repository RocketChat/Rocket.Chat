---
'@rocket.chat/meteor': patch
'@rocket.chat/rest-typings': patch
---

Fixes the `users.presence` endpoint returning an empty array when called with multiple comma-separated IDs, caused by `ajvQuery` coercing the string into a single-element array after the OpenAPI migration