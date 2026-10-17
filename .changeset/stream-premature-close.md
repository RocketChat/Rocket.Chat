---
'@rocket.chat/tools': patch
---

Reject interrupted readable streams in streamToBuffer instead of leaving the returned promise pending indefinitely.
