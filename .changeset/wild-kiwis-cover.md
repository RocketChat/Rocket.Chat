---
"@rocket.chat/meteor": patch
---

Fixes an issue where calling /api/v1/users.update with customFields would replace the whole object instead of just the specified properties.
