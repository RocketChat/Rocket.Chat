---
'@rocket.chat/meteor': patch
---

Fixes users without admin permissions being unable to change their password or profile when two-factor authentication is enabled, getting a "too many requests" error after entering the 2FA code
