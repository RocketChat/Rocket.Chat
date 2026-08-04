---
'@rocket.chat/meteor': major
---

Makes LDAP and SAML authentication Premium features. Both are now gated by the `ldap-enterprise` and `saml-enterprise` license modules: `LDAP_Enable` and `SAML_Custom_<service>` fall back to `false` on workspaces without them, the login handlers and the `/_saml` endpoints refuse to run, and `ldap.syncNow`, `ldap.testConnection` and `ldap.testSearch` return `error-action-not-allowed`. The implementation also moved from `apps/meteor/server` to `apps/meteor/ee/server`, so it is covered by the Rocket.Chat Enterprise license instead of the community one.
