---
'@rocket.chat/xmpp-server': patch
---

Removes an XMPP occupant from a hosted room once they can no longer be reached: when their server answers a message or presence with a delivery error such as `recipient-unavailable` or `item-not-found`, or when their server cannot be connected to. The other occupants stop seeing them in the room. A connection that only closes because it was idle removes no one, and the occupant can join again.
