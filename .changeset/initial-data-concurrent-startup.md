---
'@rocket.chat/meteor': patch
'@rocket.chat/model-typings': patch
'@rocket.chat/models': patch
---

Fixes instances started at the same time on a new database hanging at startup on a duplicate key error while creating the `GENERAL` room or the `rocket.cat` user
