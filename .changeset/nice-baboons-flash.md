---
'@rocket.chat/federation-matrix': patch
'@rocket.chat/meteor': patch
---

Fixes an issue where editing or deleting a message in a federated room caused subsequent messages to stop syncing between servers

Note: this prevents the issue from happening, but does not restore rooms that are already affected. Recovering those requires a separate, one-time repair.
