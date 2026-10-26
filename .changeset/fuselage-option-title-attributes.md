---
'@rocket.chat/fuselage': patch
---

`OptionTitle` accepts and keeps the HTML attributes and `className` it is given, and `SidebarCollapseGroup` no longer declares the `actions` prop, which it never used.
