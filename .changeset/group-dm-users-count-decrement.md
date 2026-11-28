---
'@rocket.chat/models': patch
'@rocket.chat/meteor': patch
---

Fixes an `E11000 duplicate key` error when updating display names after a group direct message has shrunk to 2 members due to user deletion
