---
"@rocket.chat/meteor": patch
---

Added file id to message exports zip file names in order to avoid overwriting previous exports when using external storage services (such as Amazon S3)
