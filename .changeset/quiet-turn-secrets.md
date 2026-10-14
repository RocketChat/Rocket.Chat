---
'@rocket.chat/meteor': minor
'@rocket.chat/i18n': minor
'@rocket.chat/media-signaling': minor
'@rocket.chat/media-calls': minor
'@rocket.chat/ui-voip': minor
---

Adds a private **TURN servers** setting for voice calls. TURN servers and their credentials configured there are only handed to users on a call, instead of being readable by anyone through the public ICE servers setting. Each server can use fixed credentials or a shared secret, in which case the workspace issues each user time-limited credentials for every call and the secret never leaves the server (TURN REST API, as supported by coturn's `use-auth-secret`).
