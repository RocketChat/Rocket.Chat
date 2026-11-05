---
'@rocket.chat/meteor': patch
---

Fixes rooms and users named `.` or `..` being created even though they can't be opened, since browsers drop those names from the URL
