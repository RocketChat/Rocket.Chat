---
'@rocket.chat/model-typings': patch
'@rocket.chat/models': patch
'@rocket.chat/meteor': patch
---

Fixes an issue with Omnichannel inquiries where multiple instances could take the same inquiry from the queue resulting in the same room being assined to multiple agents.
