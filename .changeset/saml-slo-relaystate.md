---
'@rocket.chat/meteor': patch
---

Fixes the SAML Single Logout response so the `RelayState` matches the exact value received on the logout request, as required by the SAML specification, instead of using Rocket.Chat's own URL
