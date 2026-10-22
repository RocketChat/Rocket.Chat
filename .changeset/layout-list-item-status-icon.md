---
'@rocket.chat/layout': patch
---

Narrows `ListItem`'s `iconColor` to a `StatusIcon` status; without one the icon follows the item's text colour, as it already did.
