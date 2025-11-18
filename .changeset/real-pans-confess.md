---
'@rocket.chat/apps-engine': minor
'@rocket.chat/meteor': minor
---

Changes a behavior that would store the result of every status transition that happened to apps

This caused intermediate status to be saved to the database, which could prevent apps from being restored to the desired status when restarted or during server startup.
