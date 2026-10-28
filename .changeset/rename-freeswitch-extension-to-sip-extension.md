---
'@rocket.chat/meteor': major
'@rocket.chat/core-typings': major
'@rocket.chat/rest-typings': major
'@rocket.chat/model-typings': major
'@rocket.chat/models': major
'@rocket.chat/media-calls': major
'@rocket.chat/ui-voip': major
---

Renames the user `freeSwitchExtension` attribute to `sipExtension`, since the VoIP extension is no longer tied to FreeSWITCH and works with any SIP router. Existing users are migrated automatically on upgrade. REST API integrations must switch to the new name: the `users.create` and `users.update` parameters, the `users.info` query parameter, and the `sipExtension` field returned on user objects.
