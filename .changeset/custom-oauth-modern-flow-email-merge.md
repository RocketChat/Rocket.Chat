---
'@rocket.chat/meteor': patch
---

Fixes an issue in Custom OAuth with "Use Modern OAuth Flow" enabled where the user's email was dropped, preventing account merging into existing accounts, and causing the login to hang on username collisions.
