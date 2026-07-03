---
'@rocket.chat/meteor': patch
---

Fixed agents' business-hour availability not being updated when they are removed from a department linked to a business hour while multiple business hours are enabled. The recomputation step failed silently, leaving removed agents available (or unavailable) according to a business hour that no longer applied to them.
