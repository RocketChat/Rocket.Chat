---
'@rocket.chat/meteor': major
---

Changes the `commands.run` and `commands.preview` REST endpoints to respond with `403 Forbidden` instead of `400 Bad Request` when the user is not authorized to use the command. The response body is the standard REST API `403` body and no longer carries `errorType: 'error-not-authorized'`.
