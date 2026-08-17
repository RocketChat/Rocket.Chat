---
'@rocket.chat/i18n': minor
'@rocket.chat/meteor': minor
---

Deprecates LDAP and SAML authentication on workspaces without a Premium plan. Both keep working as they are today, but the admin settings now warn that version 9.0.0 will require a license including the `ldap-enterprise` or `saml-enterprise` module, and a warning is logged when an unlicensed workspace authenticates a user through either of them.
