---
'@rocket.chat/api-client': minor
---

Validates the response body in the REST client instead of casting it, throwing `InvalidResponseError` (now exported) on invalid JSON or non-object bodies. `get`, `put` and `delete` now return `{}` for 204 and 205 responses, as `post` already did.