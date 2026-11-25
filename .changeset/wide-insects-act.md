---
'@rocket.chat/meteor': patch
---

Fixes an issue where the IPostUserCreated event was triggered too early in some creation paths and apps got only a small subset of the user's information
