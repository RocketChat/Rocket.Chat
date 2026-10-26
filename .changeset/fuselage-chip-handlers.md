---
'@rocket.chat/fuselage': patch
---

Fixes `Chip` re-binding `onMouseDown` as `onClick`; each handler now fires on its own event.
