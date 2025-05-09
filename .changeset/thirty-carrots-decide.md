---
'@rocket.chat/meteor': patch
---

Fixes the room history pruning behavior when filesOnly is true to ensure only file-type attachments are removed, preserving quotes and non-file attachments.
