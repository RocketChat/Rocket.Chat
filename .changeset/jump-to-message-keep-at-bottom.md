---
'@rocket.chat/meteor': patch
---

Fixes opening a message link (`?msg=`) in a room whose history is taller than the viewport: the list was scrolled back to the latest message while the jump target was being measured, so the linked message never came into view.
