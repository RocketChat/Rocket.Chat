---
"@rocket.chat/meteor": patch
---

Fixed `LivechatSessionTaken` webhook event being called without the `agent` param, which represents the agent serving the room.
