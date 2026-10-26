---
'@rocket.chat/i18n': minor
'@rocket.chat/meteor': minor
---

Adds Dynamic Client Registration (RFC 7591) to the OAuth2 server at `/oauth/register`, behind the new "Allow dynamic client registration" setting, off by default. While it is off, registration requests get an error that explains how to enable it.
