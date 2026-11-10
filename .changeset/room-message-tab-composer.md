---
'@rocket.chat/meteor': patch
---

Fixes Tab in the room and thread message lists moving to the next message instead of the composer: Tab now walks the focused message's controls, entering its toolbar as a single stop whose buttons the arrow keys move between, then moves to the composer; Shift+Tab walks back to the message and then to the top of the room, or of the contextual bar for a thread, and Escape returns from a control to its message
