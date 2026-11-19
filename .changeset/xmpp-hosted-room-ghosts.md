---
'@rocket.chat/xmpp-server': patch
---

Removes an XMPP occupant from a hosted room when their server can no longer be reached, so the other occupants stop seeing them in the room. A connection that only closes because it was idle removes no one, and the user can join again.
