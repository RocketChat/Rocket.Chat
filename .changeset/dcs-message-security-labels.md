---
'@rocket.chat/meteor': minor
'@rocket.chat/core-typings': minor
'@rocket.chat/rest-typings': minor
'@rocket.chat/i18n': minor
'@rocket.chat/dcs': minor
---

Adds confidentiality labels on messages (data-centric security), available with the ABAC license module when **Enable security labels on messages** is on. Senders pick a label from the room's catalog, each message shows its marking, and readers not cleared for a label receive nothing about the message. Policies come from an Open XML SPIF, and room and user clearances are managed through the `dcs/*` REST endpoints.
