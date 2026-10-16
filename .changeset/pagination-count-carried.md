---
'@rocket.chat/models': patch
'@rocket.chat/meteor': patch
---

Fixes `count` in the responses of `rooms.images`, `teams.listChildren`, `sessions/list` and `sessions/list.all`, which echoed the requested page size instead of how many items the page carried, so a short last page reported more items than it held.
