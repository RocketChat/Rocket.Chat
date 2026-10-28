---
'@rocket.chat/meteor': patch
'@rocket.chat/i18n': patch
---

Fixes LDAP "Sync now" reporting success when the sync did not run or failed: it now reports when nothing is enabled to sync, and shows the error that stopped the sync
