---
"@rocket.chat/meteor": patch
---

Fixed an issue where old exports would get overwritten by new ones if generated on the same day, when using external storage services (such as Amazon S3)
