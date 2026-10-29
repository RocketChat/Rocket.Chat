---
'@rocket.chat/meteor': major
'@rocket.chat/i18n': major
'@rocket.chat/ui-client': major
---

Removes the "Allow Anonymous Write" setting (`Accounts_AllowAnonymousWrite`), the "Or talk as anonymous" composer action, and the anonymous branch of the `registerUser` method. Anonymous read remains available. The `anonymous` role is removed along with its default permissions and the `afterVerifyEmail` method. On upgrade the setting and role are deleted from the database and any existing users holding the `anonymous` role are deactivated and logged out.
