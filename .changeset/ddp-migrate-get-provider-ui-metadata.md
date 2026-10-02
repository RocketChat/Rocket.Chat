---
'@rocket.chat/meteor': minor
---

Adds a new `GET /v1/autotranslate.getProviderUiMetadata` endpoint that lists the registered auto-translate providers and their display names, and deprecates the `autoTranslate.getProviderUiMetadata` real-time API method in its favor. The method keeps working until it is removed in 9.0.0.
