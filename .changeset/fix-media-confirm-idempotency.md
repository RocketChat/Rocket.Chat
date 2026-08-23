---
'@rocket.chat/meteor': patch
---

Fixed `rooms.mediaConfirm` creating duplicate messages when the same fileId was confirmed more than once, such as a client retrying after a dropped response. The endpoint now returns the existing message (and confirms the upload if needed) instead of inserting a new one when a confirmation for that file has already been processed.
