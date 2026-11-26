---
'@rocket.chat/meteor': patch
---

Fixes a data export hanging forever when the export archive file cannot be written (for example when the disk is full or the target is not writable)
