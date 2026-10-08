---
'@rocket.chat/meteor': patch
'@rocket.chat/i18n': patch
---

Fixes LDAP "Test Connection" and "Test LDAP Search" hiding a wrong authentication password: both now report the bind failure with the LDAP server's error, and the search test tells apart "no user found" from "more than one user found"
