---
"@rocket.chat/meteor": patch
"@rocket.chat/model-typings": patch
---

Fixed email inbox behavior that caused RC to incorrectly store information received on email inboxes only once per email, ignoring all subsequent and possible data received on future emails
