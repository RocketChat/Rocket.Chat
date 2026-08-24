---
'@rocket.chat/rest-typings': patch
'@rocket.chat/i18n': patch
'@rocket.chat/meteor': patch
---

Adds an Import IdP metadata option to SAML settings that fetches the Identity Provider metadata from a URL and prefills the matching setting fields — certificate, entry point and IDP SLO redirect URL, plus identifier format on Enterprise — for the admin to review before saving.
