---
'@rocket.chat/rest-typings': minor
'@rocket.chat/meteor': minor
---

Added `POST /v1/im.blockUser` (replaces the deprecated `blockUser` / `unblockUser` DDP methods). Body is `{ roomId, block: boolean }` — `block: true` blocks the other DM participant, `block: false` unblocks. Auth-gated and per-room via the `RoomMemberActions.BLOCK` directive (DM-only). Both legacy DDP methods remain registered until 9.0.0 with deprecation logs pointing at the new route.
