---
'@rocket.chat/meteor': minor
---

Adds search of end-to-end encrypted rooms in Rocket.Chat Desktop. When the desktop app provides a local search index, the client indexes the messages that it decrypts, fetches older messages of encrypted rooms while the user is idle, and the message search of an encrypted room queries that local index. The server never receives the search terms or the decrypted text. Without a desktop index, the search of encrypted rooms works as before.
