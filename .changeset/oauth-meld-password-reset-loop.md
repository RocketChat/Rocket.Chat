---
'@rocket.chat/model-typings': patch
'@rocket.chat/models': patch
'@rocket.chat/meteor': patch
---

Fixes users signing in with Custom OAuth/OIDC (and other melded providers) getting stuck on the reset password page with "This email has already been used and has not been verified", and releases accounts that were already stuck
