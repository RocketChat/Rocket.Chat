---
"@rocket.chat/meteor": patch
---

Fixes a race condition between the queueing of an inquiry when transfering and the queue worker processing before the room is updated
