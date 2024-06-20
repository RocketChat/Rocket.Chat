---
'@rocket.chat/meteor': patch
---

This adjustment removes the deprecated `eraseRoom` method. Moving forward, use the `room.delete` endpoint to delete rooms.
