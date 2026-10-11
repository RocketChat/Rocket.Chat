---
'@rocket.chat/meteor': patch
---

Fixes LDAP background sync stopping for everyone when updating existing users and one of them cannot be mapped (e.g. no email address); that user is now skipped and logged with its DN
