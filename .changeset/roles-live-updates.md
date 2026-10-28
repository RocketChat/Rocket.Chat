---
'@rocket.chat/meteor': patch
---

Fixes role changes not reaching the UI until a reload: roles granted or revoked in a room now update the room's member roles (and workspace roles) live, and role changes from other rooms no longer leak into the current one
