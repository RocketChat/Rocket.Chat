---
'@rocket.chat/meteor': patch
---

Adds debug-level logging of the Cloud push gateway's response status and body when a push notification is accepted, making it possible to diagnose cases where the gateway accepts a push (HTTP 200) but it isn't delivered downstream to FCM/APNs.
