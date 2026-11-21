---
'@rocket.chat/meteor': patch
---

Fixes issue where marking channels as read in quick succession could target the wrong channel due to index-based keys in virtualized room lists
