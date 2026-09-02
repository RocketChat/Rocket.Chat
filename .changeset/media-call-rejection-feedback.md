---
'@rocket.chat/core-typings': minor
'@rocket.chat/media-signaling': minor
'@rocket.chat/media-calls': minor
'@rocket.chat/ui-voip': minor
'@rocket.chat/i18n': minor
'@rocket.chat/meteor': minor
---

Keeps a record of a voice call an app prevented. The call is written down as it is refused - already ended, carrying the app that refused it and the explanation it gave - so the attempt reaches the call history and the direct message the same way every other ended call does. Nothing interrupts the caller: the words are kept on the call instead of being shown as a toast
