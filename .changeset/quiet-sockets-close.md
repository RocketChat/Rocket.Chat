---
'@rocket.chat/server-fetch': patch
'@rocket.chat/meteor': patch
---

Prevents outbound HTTP requests, such as SAML metadata fetches and public import file downloads, from keeping connections open after an error response or redirect while the remote server continues sending data.
