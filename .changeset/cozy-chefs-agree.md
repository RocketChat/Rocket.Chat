---
'@rocket.chat/api-client': minor
---

Validates the response body in the REST client instead of casting it, throwing `InvalidResponseError` (now exported) on invalid JSON or non-object bodies. Empty 204 responses from `post` are still returned as `{}`.