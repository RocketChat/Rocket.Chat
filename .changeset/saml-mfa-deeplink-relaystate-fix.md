---
'@rocket.chat/meteor': patch
---

Fixes SAML + IdP MFA deep-link callback failure on mobile devices introduced in 8.8.0.

When an Identity Provider (IdP) enforces multi-step 2FA/MFA challenges (such as Okta Verify, Azure AD Conditional Access, Duo, or PingIdentity), the SAML `RelayState` parameter containing the `loginClient` context was not correctly decoded. IdPs may URL-encode the `RelayState` value or reorder its query parameters across MFA redirect hops. As a result, `loginClient` was silently lost, causing the server to omit the `&loginClient=mobile` segment from the post-authentication redirect. The mobile app never received the `rocketchat://auth` deep-link callback and remained stuck on the login screen.

The fix updates `SAMLUtils.decodeAuthorizeRelayState` to handle position-independent parameter parsing and safely attempt `decodeURIComponent` only when the string contains no literal separators, preserving provider values that legitimately contain `&` or `=` characters.
