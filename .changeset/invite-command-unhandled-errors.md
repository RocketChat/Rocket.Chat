---
'@rocket.chat/meteor': patch
---

Fixes `/invite` showing a raw error code, or nothing at all, when inviting a user fails with an error that has no translation; it now shows a generic error message and logs the error on the server.
