---
'@rocket.chat/xmpp-server': patch
---

Removes an XMPP occupant from a hosted room when a Rocket.Chat member joins under the same name, and tells them they were removed, instead of letting the member silently take their place. They stay a member of the room and can join again under another nick.
