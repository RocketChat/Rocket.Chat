---
'@rocket.chat/meteor': patch
---

Stops the sidebar region from borrowing the `rcx-sidebar` class from Fuselage; the region already sets its own layout and the sidebar inside paints the colors.
