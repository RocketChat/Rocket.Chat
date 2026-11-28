---
'@rocket.chat/meteor': patch
'@rocket.chat/federation-matrix': patch
'@rocket.chat/core-services': patch
---

Fixes rooms joined from a federated invite showing up as a DM named after the inviter instead of under the room's name, when the inviting homeserver (such as tuwunel) sends the invite without `unsigned` data
