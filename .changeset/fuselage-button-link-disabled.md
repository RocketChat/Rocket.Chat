---
'@rocket.chat/fuselage': patch
---

Fixed a disabled or loading `Button` rendered as a link (`is="a"`) still navigating and calling `onClick`.
