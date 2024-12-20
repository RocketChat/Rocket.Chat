---
"@rocket.chat/meteor": patch
---

Fixes a UI issue that showed the incorrect migration number on the `Information` page. This was caused by a function calculating the stats before the server had migrated the database and updated the control.
