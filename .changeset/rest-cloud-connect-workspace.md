---
'@rocket.chat/rest-typings': minor
'@rocket.chat/meteor': minor
---

Added `POST /v1/cloud.connectWorkspace` (replaces the deprecated `cloud:connectWorkspace` DDP method). Body is `{ token }`; auth-gated with `manage-cloud` permission. The legacy DDP method remains registered with a deprecation log pointing at the new route.
