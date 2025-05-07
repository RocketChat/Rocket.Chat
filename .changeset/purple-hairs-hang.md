---
"@rocket.chat/meteor": patch
---

Fixes an issue where enterprise routing algorithms could get stuck on selecting the same agent due to chat limits being applied after agent selection, but before agent assignment
