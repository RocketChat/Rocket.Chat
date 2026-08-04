---
'@rocket.chat/models': patch
'@rocket.chat/model-typings': patch
'@rocket.chat/meteor': patch
---

Fixes a race condition that left messages permanently undecryptable ("incorrect encryption key") in rooms created with encryption enabled. When several members opened such a room at the same time, each client could independently generate and distribute a different group key. Establishing the room key is now atomic (first-write-wins) on the server, and a client that loses the race discards its locally generated key and adopts the established one instead of encrypting with a divergent key.
