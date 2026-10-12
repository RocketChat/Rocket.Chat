---
'@rocket.chat/server-fetch': patch
'@rocket.chat/meteor': patch
---

Fixes outbound HTTP requests, such as SAML metadata fetching and public import file downloads, keeping the connection open after an error response or a redirect while the remote server keeps sending data
