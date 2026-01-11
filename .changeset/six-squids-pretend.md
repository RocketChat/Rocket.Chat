---
'@rocket.chat/meteor': major
---

Fixes role assignment precedence in SAML provisioning, ensuring that SAML-specific default roles take priority over global registration roles, and preventing role merging when both are configured.
