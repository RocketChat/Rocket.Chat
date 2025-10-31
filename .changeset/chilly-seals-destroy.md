---
'@rocket.chat/models': patch
'@rocket.chat/meteor': patch
---

Ensures that read receipts work properly by automatically marking messages as read for all deactivated members of the room, preventing inconsistencies in the message read state.
