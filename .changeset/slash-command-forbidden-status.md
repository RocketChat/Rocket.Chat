---
'@rocket.chat/meteor': major
---

Changes the `commands.run` and `commands.preview` REST endpoints to respond with `403 Forbidden` instead of `400 Bad Request` when the command refuses the action with `error-not-authorized` or `error-not-allowed`. The response body is the standard REST API `403` body and no longer carries the `errorType` field.
