---
'@rocket.chat/meteor': patch
---

Fixes `POST /api/v1/logout` and `GET /api/v1/logout` returning an HTTP 200 with an empty response body instead of the JSON logout confirmation payload.
