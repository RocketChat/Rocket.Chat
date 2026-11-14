---
'@rocket.chat/fuselage-hooks': patch
'@rocket.chat/meteor': patch
---

Prevents flushing completed or cancelled debounced callbacks from running them again, including callbacks discarded on unmount.
