---
'@rocket.chat/tools': patch
'@rocket.chat/meteor': patch
---

Fixes invalid fractional or non-finite login expiration values causing token expiration to throw instead of using the default duration.
