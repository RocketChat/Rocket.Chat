---
'@rocket.chat/meteor': patch
'@rocket.chat/models': patch
'@rocket.chat/model-typings': patch
'@rocket.chat/presence': patch
---

Fixes high database load when many users disconnect at once, such as after a network outage or an instance restart
