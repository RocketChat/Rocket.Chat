---
"@rocket.chat/meteor": patch
---

Optimized user mention lookup in message notification path from O(n) Array.includes to O(1) Set.has, reducing computational overhead in rooms with many mentions and subscriptions.
