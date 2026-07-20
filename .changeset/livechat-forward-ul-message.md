---
'@rocket.chat/meteor': patch
---

Fixes an issue where the "user left" system message could be added to an Omnichannel conversation only after the forwarding process had already finished, causing it to appear out of order in the conversation history
