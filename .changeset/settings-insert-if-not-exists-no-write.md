---
'@rocket.chat/models': patch
'@rocket.chat/meteor': patch
---

Fixes `Settings.insertIfNotExists` rewriting `_updatedAt` on a setting that already exists instead of leaving it untouched
