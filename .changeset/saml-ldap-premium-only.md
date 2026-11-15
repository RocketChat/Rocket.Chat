---
'@rocket.chat/meteor': major
---

Makes LDAP and SAML authentication Premium features. **Breaking:** workspaces without a Premium plan that includes the `ldap-enterprise` or `saml-enterprise` module lose LDAP and SAML login on upgrade to 9.0.0. Keep a Premium license or an admin account that signs in another way before upgrading.
