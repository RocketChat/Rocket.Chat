---
'@rocket.chat/fuselage': patch
'@rocket.chat/meteor': patch
---

Fixes message actions not appearing on hover at some window sizes and zoom levels. `MessageToolbarWrapper` now spans its whole message row and lets clicks through to the row underneath.
