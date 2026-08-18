---
'@rocket.chat/meteor': major
'@rocket.chat/i18n': major
'@rocket.chat/ui-client': major
---

Removes the "Allow Anonymous Write" setting (`Accounts_AllowAnonymousWrite`), the "Or talk as anonymous" composer action, and the anonymous branch of the `registerUser` method. Anonymous read remains available; the setting is deleted from the database on upgrade.
