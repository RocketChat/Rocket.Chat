---
'@rocket.chat/meteor': patch
---

Fixes files uploaded before 9.0 outside `rooms.media` (such as livechat visitor uploads) not opening from the image gallery and the Files panel, and `channels.files`, `groups.files`, `im.files` and `rooms.images` returning dead `/ufs/...` links for them.
