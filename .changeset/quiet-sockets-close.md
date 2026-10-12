---
'@rocket.chat/meteor': patch
---

Fixes SAML metadata fetching and public import file downloads keeping the outbound connection open when the remote server answers with an error and keeps sending data
