---
'@rocket.chat/federation-matrix': patch
'@rocket.chat/meteor': patch
---

Fixes federated invites failing when the inviting server sends a room join rule without a value; such rooms are now treated as invite-only
