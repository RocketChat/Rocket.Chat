---
'@rocket.chat/fuselage': patch
---

Fixed `FieldGroup`, `CardGroup`, `NavBarItem` and other components that add a class to their children dropping a child's CSS-in-JS (`css`) `className`.
