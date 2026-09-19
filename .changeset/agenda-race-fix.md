---
'@rocket.chat/agenda': patch
---

Prevents multiple polling intervals from being created when `Agenda.start()` is called concurrently, fixing a timer leak that could not be cleared by `stop()`.