---
"@rocket.chat/meteor": patch
---

Executing a logout and login action in the same "tab/instance", some streams were not being recreated, causing countless types of bugs.

PS: as a workaround reloading after logout or login  in also solves the problem.
