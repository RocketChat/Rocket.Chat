---
'@rocket.chat/meteor': patch
'@rocket.chat/federation-matrix': patch
'@rocket.chat/core-services': patch
---

Fixes federated events, such as a remote user joining, being permanently rejected when they arrive before the events that authorize them; the missing events are now fetched from the sending server and the event is processed once they are stored
