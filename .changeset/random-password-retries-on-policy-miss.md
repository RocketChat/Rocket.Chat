---
'@rocket.chat/meteor': patch
---

Fixes setting a random password for a user failing when the first generated password broke the password policy, instead of generating another one
