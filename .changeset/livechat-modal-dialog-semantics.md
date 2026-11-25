---
'@rocket.chat/livechat': patch
---

Gives the Livechat modal dialog semantics and focus handling: it has the `dialog` role (`alertdialog` for alerts and confirmations), is named by its title or message, moves focus into the dialog when it opens, keeps Tab inside it and returns focus to the opener when it closes
