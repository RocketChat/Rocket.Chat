---
'@rocket.chat/meteor': patch
---

Fixes `users.sendConfirmationEmail` rejecting unauthenticated requests, which prevented unverified users from resending their verification email from the login screen
