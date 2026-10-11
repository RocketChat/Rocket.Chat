---
'@rocket.chat/meteor': patch
---

Fixes users not being added to the default channels (such as `#general`) when they are assigned their first username, which affected the admin created by the setup wizard on a brand new workspace and OAuth, SAML and LDAP users that pick a username through the "Register Username" screen.
