---
"@rocket.chat/meteor": patch
---

Fixes an issue where files containing exif data would fail to upload to S3 when `Message_Attachments_Strip_Exif` is enabled.
