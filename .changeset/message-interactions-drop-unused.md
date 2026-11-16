---
'@rocket.chat/ui-message-list': patch
---

Removes from the interactions context of the message components the capabilities the components never read (pin, unpin, star, unstar, mark unread, translate, show original, edit, can delete, request deletion, report, reaction list, read receipts and start a discussion), which the app's own menu actions carry out
