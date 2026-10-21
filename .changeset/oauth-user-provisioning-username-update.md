---
'@rocket.chat/meteor': patch
'@rocket.chat/models': patch
'@rocket.chat/model-typings': patch
---

Fixes an issue where OAuth provisioned users do not have their username updated on subsequent logins after OAuth username mapping is changed (#27130)
