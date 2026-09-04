---
'@rocket.chat/models': patch
'@rocket.chat/meteor': patch
---

Fixes custom roles created before the `protected` field existed being left out of the roles an app reads through the Apps-Engine and undercounted in the `totalCustomRoles` statistic. Those roles carry no `protected` field at all, so the exact `protected: false` match in `findCustomRoles` and `countCustomRoles` skipped them, while every other place in the code decides that a role is protected by reading the field for truthiness.
