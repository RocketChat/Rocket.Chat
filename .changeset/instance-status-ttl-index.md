---
'@rocket.chat/instance-status': patch
'@rocket.chat/meteor': patch
---

Fixes the expiration index of the instance status collection not being recreated when `MULTIPLE_INSTANCES_EXPIRE` or `MULTIPLE_INSTANCES_PING_INTERVAL` changes, which left records of stopped instances in the collection
