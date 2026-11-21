---
'@rocket.chat/meteor': patch
---

Fixes `POST /v1/banners.dismiss` throwing `Banner not found` for user-level system banners (such as version updates and cloud alerts).
