---
"@rocket.chat/meteor": patch
---

Fixed the sidebar not scrolling when its content is taller than the viewport — the inner wrapper was pinned to the scroll container's height instead of using it as a minimum, so overflowing content was clipped
