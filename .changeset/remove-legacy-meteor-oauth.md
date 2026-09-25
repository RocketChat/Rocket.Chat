---
'@rocket.chat/meteor': major
'@rocket.chat/core-typings': major
'@rocket.chat/i18n': major
'@rocket.chat/ui-contexts': major
'@rocket.chat/mock-providers': patch
'@rocket.chat/web-ui-registration': patch
---

Removes the legacy Meteor OAuth login flow and the `Accounts_OAuth_Use_Modern_Flow` setting. OAuth logins (Apple, GitHub, GitLab, Google, Nextcloud and custom OAuth) now always use the server-side Passport flow, with PKCE/state validation, 2FA enforcement and deep-link handoff to the desktop and mobile apps; SAML deep-link handoff is always available. The `accounts-google`, `accounts-oauth`, `google-oauth`, `oauth` and `oauth2` Meteor packages are removed, along with the `Accounts_OAuth_Proxy_host` and `Accounts_OAuth_Proxy_services` settings, the `OAuth.retrieveCredential` DDP method, the `{ oauth: { credentialToken, credentialSecret } }` and access-token (`{ serviceName, accessToken }`) login handlers, `loginWithCustomOauth` from `AuthenticationContext`, and the `OauthConfig` type. Older mobile app versions, which only support the legacy flow, keep hiding the OAuth and SAML buttons, as they already did with the modern flow enabled, and can still sign in with Apple (native identity token), CAS and LDAP.
