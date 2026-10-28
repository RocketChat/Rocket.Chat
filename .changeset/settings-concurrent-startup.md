---
'@rocket.chat/meteor': patch
'@rocket.chat/model-typings': patch
'@rocket.chat/models': patch
---

Fixes instances started at the same time after an upgrade hanging at startup on a duplicate key error, without serving requests or restarting
