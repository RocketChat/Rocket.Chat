---
'@rocket.chat/meteor': patch
---

Fixes the web client getting stuck on the loading screen instead of redirecting to the login page when the stored authentication token is expired or revoked. The user-data sync failure is now escalated to a credential wipe so the router falls through to the login screen.
