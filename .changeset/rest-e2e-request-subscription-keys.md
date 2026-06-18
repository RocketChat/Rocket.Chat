---
'@rocket.chat/rest-typings': minor
'@rocket.chat/meteor': minor
---

Added `POST /v1/e2e.requestSubscriptionKeys` (replaces the deprecated `e2e.requestSubscriptionKeys` DDP method). Auth-gated, no body. Broadcasts `notify.e2e.keyRequest` for every encrypted room the caller is subscribed to without an E2E key, matching the DDP method's behavior. The legacy DDP method remains registered until 9.0.0 with a deprecation log pointing at the new route.
