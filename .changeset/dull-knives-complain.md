---
"@rocket.chat/meteor": patch
---

Added the allowDiskUse option to the users page queries so that if the mongodb memory threshold is exceeded it will use disk space instead of throwing an error.
