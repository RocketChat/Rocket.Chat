---
"@rocket.chat/meteor": patch
---

Fixes a behavior when transferring a room to another department that was not considering the `waiting queue` setting and attempted to route the chat to an agent instead of leaving it on the department's queue
