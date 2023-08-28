---
"@rocket.chat/meteor": patch
---

Fixed an issue causing `queue time` to be calculated from current time when a room was closed without being served.
Now:
- For served rooms: queue time = servedBy time - queuedAt
- For not served, but open rooms = now - queuedAt
- For not served and closed rooms = closedAt - queuedAt
