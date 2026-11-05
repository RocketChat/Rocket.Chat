---
'@rocket.chat/meteor': patch
---

Fixes SAML login failing after a server restart until a SAML setting was saved, when the license finished loading after the SAML service providers were first built
