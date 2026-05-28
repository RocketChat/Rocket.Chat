---
'@rocket.chat/meteor': patch
---

Migrate four client DDP callers to their REST equivalents (the DDP methods stay registered on the server for external SDK/mobile clients, with a deprecation log pointing at the REST route until 9.0.0 removes them):

- `deleteCustomSound` → `POST /v1/custom-sounds.delete`
- `blockUser` / `unblockUser` → `POST /v1/users.block` / `POST /v1/users.unblock`
- `saveSettings` → `POST /v1/settings.bulk`
- `e2e.requestSubscriptionKeys` → `POST /v1/e2e.requestSubscriptionKeys`
