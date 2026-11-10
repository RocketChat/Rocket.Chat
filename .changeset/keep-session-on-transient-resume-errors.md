---
'@rocket.chat/meteor': patch
---

Fixes the web client logging users out when the server answers a session resume with a transient error, such as an internal error or a rate limit during a restart. The session now only ends when the server refuses the token, and the resume is retried otherwise.
