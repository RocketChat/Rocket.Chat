---
'@rocket.chat/meteor': patch
---

Fixes the message list loading a room's entire history while it is covered by a full-width contextual bar, such as a thread on a narrow window: the client kept paginating until it hit the server rate limit, and the list was left scrolled far into the past once the bar closed.
