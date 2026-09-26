---
'@rocket.chat/meteor': patch
'@rocket.chat/models': patch
---

Fixed custom roles created before the `protected` field existed being missed by `findCustomRoles`/`countCustomRoles`, which affected the Apps-Engine custom roles list and the `totalCustomRoles` telemetry stat.
