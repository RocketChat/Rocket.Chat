---
'@rocket.chat/meteor': major
'@rocket.chat/core-typings': major
---

Removes the stale `Drafts` sidebar group left on workspaces upgraded from 8.5–8.7: a migration drops it from the `Accounts_Default_User_Preferences_sidebarSectionsOrder` setting and from every user's `sidebarCategories` preference, replacing the client-side read-time filter. Removes the `isStaleSidebarCategory`, `isSidebarSystemGroupKey` and `SidebarSystemGroupKey` exports from `@rocket.chat/core-typings`.
