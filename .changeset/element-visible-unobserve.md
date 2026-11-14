---
'@rocket.chat/fuselage-hooks': patch
---

Fixes `useElementIsVisible` still watching an element after its ref moves to another element or is detached, so a stale element could overwrite the visibility of the current one
