---
'@rocket.chat/meteor': minor
'@rocket.chat/i18n': minor
'@rocket.chat/core-typings': minor
---

Renames the room's prune messages panel to "Bulk delete" and applies the "Data retention" design to it. The same design applies to the retention policy settings, the room banner, the room information, and the room edit panel. The panel can now keep the original discussion messages, and its confirmation tells which messages and files the action deletes. The panel no longer has the "Inclusive" option, and it always uses its previous default. While discussion messages are pruned, the retention policy settings show "Delete original discussion messages" as on.
