---
'@rocket.chat/meteor': patch
---

Migrate low-friction client DDP callers to their REST equivalents. The DDP methods stay registered on the server for external SDK/mobile clients. Methods migrated in this batch:

- `license:isEnterprise` → `GET /v1/licenses.info` (uses `license.hasValidLicense`)
- `license:getModules` → `GET /v1/licenses.info` (uses `license.activeModules`)
- `banner/dismiss` → `POST /v1/banners.dismiss`
- `setReaction` → `POST /v1/chat.react`
- `slashCommand` → `POST /v1/commands.run`
- `e2e.resetOwnE2EKey` → `POST /v1/users.resetE2EKey`
