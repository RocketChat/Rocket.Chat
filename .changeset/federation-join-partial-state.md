---
'@rocket.chat/meteor': patch
'@rocket.chat/federation-matrix': patch
'@rocket.chat/core-services': patch
---

Fixes messages sent to a federated room failing for good with "Unable to process event, we don't have complete state yet" after joining it, when the remote server delivered the join while the room's history was still being fetched
