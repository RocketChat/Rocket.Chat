---
"@rocket.chat/meteor": patch
---

Fixes the `onlyMyDepartments` flag that some endpoints accept so it works more consistent across different user roles. Now, for monitors, `onlyMyDepartments` will include departments the user is serving as an agent. For agents, it will filter the ones the user is serving. There's no change for managers and admins, which can see anything.
