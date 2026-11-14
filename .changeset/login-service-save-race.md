---
'@rocket.chat/models': patch
'@rocket.chat/meteor': patch
---

Fixes enabling a login service (OAuth, CAS, SAML or Apple) on a multi-instance deployment failing with a duplicate key error on some instances, which could leave SAML unconfigured on them
