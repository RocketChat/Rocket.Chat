---
"@rocket.chat/meteor": patch
---

Fixed a problem with the Fallback Forward Department functionality when transferring rooms, caused by a missing return. This provoked the system to transfer to fallback department, as expected, but then continue the process and transfer to the department with no agents anyways. Also, a duplicated "user joined" message was removed from "Forward to department" functionality.
