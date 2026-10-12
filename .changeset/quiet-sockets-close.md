---
'@rocket.chat/server-fetch': patch
'@rocket.chat/meteor': patch
---

Fixes outbound HTTP requests, such as SAML metadata fetching and public import file downloads, keeping the connection open after an error response, a redirect, or a response larger than the allowed size while the remote server keeps sending data
