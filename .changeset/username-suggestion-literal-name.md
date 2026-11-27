---
'@rocket.chat/models': patch
'@rocket.chat/meteor': patch
---

Fixes the username suggestion failing when every candidate is taken and the name contains characters such as `+` or `*` (with `UTF8_Names_Slugify` disabled)
