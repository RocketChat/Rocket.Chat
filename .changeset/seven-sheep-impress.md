---
'@rocket.chat/meteor': patch
---

Deprecates the `/v1/cloud.registrationStatus` endpoint (removal in v9.0.0) in favor of `/v1/workspaces.info` which returns only necessary public information without exposing sensitive registration data.
