---
'@rocket.chat/meteor': patch
---

Fix SAML SSO login failing when 2FA is enabled by preserving the credential token until after TOTP verification completes
