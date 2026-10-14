---
'@rocket.chat/meteor': minor
'@rocket.chat/i18n': minor
'@rocket.chat/media-signaling': minor
'@rocket.chat/media-calls': minor
'@rocket.chat/ui-voip': minor
---

Adds a shared secret authentication mode for the TURN servers used by voice calls. Instead of a fixed username and password sent to every client, the workspace issues each user time-limited credentials for every call, and the shared secret never leaves the server. Works with TURN servers that support the TURN REST API, such as coturn with `use-auth-secret`.
