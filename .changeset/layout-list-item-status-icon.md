---
'@rocket.chat/layout': patch
---

Narrows `ListItem`'s `iconColor` to a status (`hint`, `info`, `danger`, `warning` or `success`); without one the icon follows the item's text colour, as it already did.
