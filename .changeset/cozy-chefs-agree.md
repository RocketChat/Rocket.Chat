---
'@rocket.chat/api-client': minor
---

Validates the response body in the REST client instead of casting it, throwing `InvalidResponseError` (now exported) on invalid JSON or non-object bodies. `post` keeps returning `{}` for empty 204 and 205 responses.