---
'@rocket.chat/meteor': patch
---

Fixes room history getting stuck on loading after importing messages with invalid timestamps; such messages are now imported with the time of the import
