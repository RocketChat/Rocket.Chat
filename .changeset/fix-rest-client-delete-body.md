---
'@rocket.chat/api-client': patch
---

Fixes `RestClient.delete` to send `params` as a request body, matching `post`/`put`. Previously the body was silently dropped, breaking DELETE endpoints that expect a body.
