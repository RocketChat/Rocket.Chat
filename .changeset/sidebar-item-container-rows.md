---
'@rocket.chat/fuselage': minor
---

Let `SidebarItem` render as a container row (`is='div'`) whose title holds the link, so menus and buttons sit beside the link instead of inside it. Adds `SidebarItemLink` and `SidebarItemActions`, and a `highlighted` prop on `SidebarItem`; a `div` row drops `href`, `target`, `rel` and `download`
