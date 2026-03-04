---
"@rocket.chat/meteor": patch
---

Optimized team name lookup in channel directory browse from O(n*m) Array.find to O(1) Map.get, improving performance for workspaces with many teams and channels.
