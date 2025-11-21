---
'@rocket.chat/meteor': patch
---

Fixes an issue related to creating new users, it should not auto opt in new users for email two factor authentication if any one of `Accounts_TwoFactorAuthentication_Enabled`, `Accounts_TwoFactorAuthentication_By_Email_Enabled` and `Accounts_TwoFactorAuthentication_By_Email_Auto_Opt_In` setting is disabled.
