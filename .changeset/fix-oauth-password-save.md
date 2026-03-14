---
'@rocket.chat/meteor': patch
---

Fixes OAuth users being unable to set their first password when `Accounts_AllowPasswordChangeForOAuthUsers` is enabled. The password change condition now correctly allows OAuth users without an existing password to set one for the first time.
