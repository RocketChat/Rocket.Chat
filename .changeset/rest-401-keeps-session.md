---
'@rocket.chat/meteor': patch
---

Fixes the web client logging users out when an action answers 401 for a reason other than an invalid session, such as hiding a room the user can no longer access.
