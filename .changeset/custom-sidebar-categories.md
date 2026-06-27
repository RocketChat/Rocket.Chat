---
'@rocket.chat/meteor': minor
'@rocket.chat/core-typings': minor
'@rocket.chat/rest-typings': minor
'@rocket.chat/i18n': minor
---

Added custom, user-defined categories to the sidebar. Users can create, rename, delete and reorder categories (menu-driven), and move rooms into them via drag-and-drop, the room context menu, or the room-header grouping icon. A room belongs to at most one custom category (mutually exclusive with Favorites), and category state is stored per-user in the `sidebarCustomCategories` preference.
