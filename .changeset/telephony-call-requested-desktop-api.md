---
'@rocket.chat/desktop-api': minor
---

Add `onTelephonyCallRequested(callback)` to the `IRocketChatDesktop` type definition. Desktop clients can expose this method to forward `tel:`/`callto:` deeplink and global-shortcut phone numbers to the media-call widget. Implemented in Rocket.Chat.Electron#3325.
