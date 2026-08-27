---
'@rocket.chat/models': major
'@rocket.chat/meteor': major
---

Removes the redundant descending `createdAt` index from the `statistics` collection, already covered by the TTL index on the same field
