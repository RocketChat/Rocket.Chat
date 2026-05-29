---
'@rocket.chat/rest-typings': minor
'@rocket.chat/meteor': minor
---

Added `POST /v1/permissions.addRole` and `POST /v1/permissions.removeRole` (replace the deprecated `authorization:addPermissionToRole` and `authorization:removeRoleFromPermission` DDP methods). Body is `{ permissionId, role }` on both. The same per-user permission checks (`access-permissions`, `access-setting-permissions`) the DDP methods enforced are reused. Legacy DDP methods remain registered with deprecation logs pointing at the new routes.
