---
'@rocket.chat/i18n': patch
'@rocket.chat/meteor': patch
---

Fixes signed URL generation for S3 and Google Cloud Storage when the expiry setting is below 5 seconds, which previously caused expired or invalid preview URLs. Adds a dedicated URL expiry setting for Google Cloud Storage since it was incorrectly reusing the AWS S3 setting.
