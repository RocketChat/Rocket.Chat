---
'@rocket.chat/rest-typings': minor
'@rocket.chat/meteor': minor
---

Added `POST /v1/custom-sounds.delete` (replaces the deprecated `deleteCustomSound` DDP method). Requires authentication and the `manage-sounds` permission. The legacy DDP method remains registered until 9.0.0 with a deprecation log pointing at the new route.
