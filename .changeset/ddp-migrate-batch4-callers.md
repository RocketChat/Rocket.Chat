---
'@rocket.chat/meteor': patch
---

Migrate six client DDP callers to their new REST equivalents (DDP methods stay registered for external SDK/mobile clients with deprecation logs until 9.0.0):

- `logoutCleanUp` → side effects now run server-side via `Accounts.onLogout` + `POST /v1/users.logout`; client `sdk.call` dropped.
- `setAvatarFromService` → `POST /v1/users.setAvatar` (new `service` multipart field).
- `cloud:connectWorkspace` → `POST /v1/cloud.connectWorkspace`.
- `verifyEmail` + `afterVerifyEmail` → single `POST /v1/users.verifyEmail` call.
- `authorization:addPermissionToRole` / `removeRoleFromPermission` → `POST /v1/permissions.addRole` / `POST /v1/permissions.removeRole`.
- `clearIntegrationHistory` / `replayOutgoingIntegration` → `POST /v1/integrations.history.clear` / `POST /v1/integrations.outgoing.replay`.
