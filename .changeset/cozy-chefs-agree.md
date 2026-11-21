---
'@rocket.chat/api-client': minor
---

Reports a response body that is not valid JSON as a new exported `InvalidResponseError` instead of surfacing a raw `SyntaxError`. Empty 204 responses from `post` are still returned as `{}`.