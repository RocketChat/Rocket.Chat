---
'@rocket.chat/abac': minor
'@rocket.chat/core-services': minor
'@rocket.chat/ddp-client': minor
'@rocket.chat/meteor': minor
---

Adds `GET /v1/abac/config`, which serves signed-in users the ABAC configuration the client needs to render rooms, starting with the classification banners configuration. The client now reads the banners configuration from this endpoint and refreshes it when an administrator changes it.
