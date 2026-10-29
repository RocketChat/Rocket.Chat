---
'@rocket.chat/desktop-api': minor
'@rocket.chat/i18n': minor
'@rocket.chat/meteor': minor
---

Adds local search of end-to-end encrypted messages in the desktop app. An admin turns on **Local search of encrypted messages**, and each user turns on **Index my encrypted messages on this device**. Then the desktop app keeps an encrypted index of the decrypted messages on the user's device. The message search of an encrypted room finds them. The server never receives the index or the search terms. Adds the types of the desktop app's local search index (`RocketChatDesktop.e2eeSearch`) to `@rocket.chat/desktop-api`.
