---
'@rocket.chat/meteor': patch
'@rocket.chat/federation-matrix': patch
'@rocket.chat/core-services': patch
---

Fixes federated events, such as a remote user joining, being permanently rejected when they arrive before the events that authorize them; they now wait until those events are stored
