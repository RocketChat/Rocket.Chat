---
'@rocket.chat/rest-typings': minor
'@rocket.chat/meteor': minor
---

Added `POST /v1/users.block` and `POST /v1/users.unblock` (replace the deprecated `blockUser` / `unblockUser` DDP methods). Both accept `{ rid, userId }`, are auth-gated, and reuse the per-room `RoomMemberActions.BLOCK` directive that the DDP method already enforced. The legacy DDP methods remain registered until 9.0.0 with a deprecation log pointing at the new routes.
