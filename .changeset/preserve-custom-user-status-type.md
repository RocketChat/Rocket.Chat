---
"@rocket.chat/meteor": patch
---

Fixes an issue where `POST /api/v1/custom-user-status.update` silently overwrites existing `statusType` with an empty string `""` when `statusType` is omitted from the request payload.

