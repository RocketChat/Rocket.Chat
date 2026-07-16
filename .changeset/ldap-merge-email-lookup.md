---
'@rocket.chat/models': patch
'@rocket.chat/meteor': patch
---

Fixes LDAP sync failing to merge an existing user matched by email, which caused a `Username already exists` error when the user's username differed from the directory.
