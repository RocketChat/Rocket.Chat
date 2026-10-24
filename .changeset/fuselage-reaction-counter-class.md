---
'@rocket.chat/fuselage': patch
---

Fixes `MessageReactionCounter` adding an `undefined` class when it gets no `className`.
