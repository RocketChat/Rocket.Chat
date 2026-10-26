---
'@rocket.chat/fuselage': patch
---

Fixes the `States`, `Message`, `ThreadMessage`, `NavBar`, `Pagination`, `Sidebar` and `Option` parts, `MessageBlock`, `MessageReactions`, `NavBarItem` and `Position` replacing or dropping a consumer `className` instead of keeping it next to their own class. `InputBox` now puts `className` on the wrapper when it has an addon, and on the input otherwise, instead of on both.
