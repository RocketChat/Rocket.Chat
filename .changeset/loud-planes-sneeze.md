---
"@rocket.chat/meteor": patch
---

Fixed a problem that caused the wrong system message to be sent when a chat was resumed from on hold status.
Note: This fix is not retroactive so rooms where a wrong message was already sent will still show the wrong message. New calls to the resume actions will have the proper message.
