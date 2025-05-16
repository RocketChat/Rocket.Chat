---
'@rocket.chat/meteor': patch
---

Recovers from errors in `RoomHistoryMaanger.getMore`, avoiding a "permaloading" state after user logout.
