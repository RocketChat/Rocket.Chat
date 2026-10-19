---
'@rocket.chat/meteor': patch
---

Fixed a slash command's description being overwritten with its params string when an App modifies the command without supplying `i18nDescription`
