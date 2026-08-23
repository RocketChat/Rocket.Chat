---
'@rocket.chat/meteor': patch
'@rocket.chat/models': patch
---


Fixed `rooms.mediaConfirm` creating duplicate messages when the same fileId was confirmed more than once, such as a client retrying after a dropped response or two near-simultaneous confirm requests. The endpoint now returns the existing message instead of inserting a new one when a confirmation for that file has already been processed, and the `file._id` index in the messages collection is now unique to prevent duplicates under concurrent requests as well.
