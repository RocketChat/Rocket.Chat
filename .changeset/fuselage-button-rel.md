---
'@rocket.chat/fuselage': patch
---

Fixes `Button` discarding the `rel` it is given; an external link keeps defaulting to `noopener noreferrer` when it has none.
