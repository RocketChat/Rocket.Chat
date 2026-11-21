---
'@rocket.chat/presence': patch
---

Prevents the presence cleanup from starting a new pass over user sessions while the previous one is still running, which doubled the database load whenever a pass took longer than a minute
