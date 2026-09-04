---
'@rocket.chat/meteor': patch
---

Fixes mobile SAML login failing with "No matching login attempt found": the SAML login handler no longer deletes the credential token on its first redemption, so the in-app webview and the native app can both redeem the same token as the mobile login flow requires. Credential tokens are still cleaned up by the existing TTL index on `expireAt`.