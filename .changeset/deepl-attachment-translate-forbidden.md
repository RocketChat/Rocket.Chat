---
'@rocket.chat/meteor': patch
---

Fixed DeepL auto-translation of message attachment descriptions failing with a `403 Forbidden` error. The attachment translation request was using DeepL's deprecated `auth_key` query parameter, which the API no longer accepts; it now authenticates with the `Authorization: DeepL-Auth-Key` header (and `POST`) consistent with regular message translation.
