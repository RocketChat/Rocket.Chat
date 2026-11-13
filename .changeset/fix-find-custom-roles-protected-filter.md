---
'@rocket.chat/models': patch
---

Fixed `findCustomRoles` and `countCustomRoles` missing legacy custom roles that have no `protected` field set. The filter now treats both `protected: false` and a missing/undefined `protected` field as non-protected, restoring expected behavior for instances upgraded from older Rocket.Chat versions.
