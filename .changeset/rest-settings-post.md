---
'@rocket.chat/rest-typings': minor
'@rocket.chat/meteor': minor
---

Added `POST /v1/settings` for batched admin setting updates (replaces the deprecated `saveSettings` DDP method). Body is `{ settings: { _id, value }[] }`. The endpoint requires authentication, enforces 2FA (`twoFactorRequired: true`), and runs the same per-setting permission chain (`edit-privileged-setting` OR `manage-selected-settings` + per-id permission) and audit/notify side effects the DDP method already performed. The legacy DDP method remains registered until 9.0.0 with a deprecation log pointing at the new route.
