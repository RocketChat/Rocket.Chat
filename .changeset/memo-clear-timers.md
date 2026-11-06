---
'@rocket.chat/memo': patch
---

Fixes `clear` leaving `maxAge` timers running, which expired values cached after the clear too early
