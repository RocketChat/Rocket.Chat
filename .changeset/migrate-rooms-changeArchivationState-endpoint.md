---
'@rocket.chat/meteor': minor
'@rocket.chat/rest-typings': minor
---

Migrates `rooms.changeArchivationState` to the chained API pattern and removes its dedicated manual validator export from rest-typings in favor of endpoint-local schema definition.