---
'@rocket.chat/ui-client': patch
---

Fixes the tooltip provider leaving its click listener on the page after unmounting, because it was removed without the capture flag it was added with
