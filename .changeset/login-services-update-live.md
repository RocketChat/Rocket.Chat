---
'@rocket.chat/meteor': patch
---

Fixes the login page keeping stale login buttons until the server restarts after CAS is enabled or disabled, a custom OAuth provider is disabled, or the login services are refreshed
