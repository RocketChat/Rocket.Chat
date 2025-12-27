---
'@rocket.chat/meteor': patch
---

Fixes a condition where the `SAML_Custom_Default_default_user_role` setting, used to define the default SAML role when none is provided, would fail when a role name was used instead of an ID.
