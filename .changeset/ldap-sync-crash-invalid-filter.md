---
'@rocket.chat/meteor': patch
---

Fixes the server crashing during LDAP login or sync when the configured search settings produce an invalid LDAP filter (for example, an empty User Search Field). The operation now fails gracefully with a logged error instead of terminating the process.
