---
'@rocket.chat/federation-matrix': patch
'@rocket.chat/meteor': patch
---

Fixes federation endpoints rejecting valid requests, which broke:

- room history backfill
- image thumbnails
- room message pagination
- accepting an invite from another homeserver
