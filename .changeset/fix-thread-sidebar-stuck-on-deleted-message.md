---
'@rocket.chat/meteor': patch
---

Fixed a bug where the Threads sidebar would become stuck when the parent message of a thread was unavailable (deleted or removed). The sidebar now auto-closes itself in these cases instead of locking users into a non-functional state requiring a page reload.
