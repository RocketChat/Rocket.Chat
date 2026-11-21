---
'@rocket.chat/meteor': patch
'@rocket.chat/models': patch
'@rocket.chat/model-typings': patch
---

Fixes `@all` / `@here` inside a thread notifying the whole room but leaving no unread indicator (highlighted room and thread badge) for members who don't follow the thread
