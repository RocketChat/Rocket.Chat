---
'@rocket.chat/meteor': patch
---

Fixes audio and video attachments served through the Amazon S3 or Google Cloud Storage proxy not showing their duration or progress until playback ended, and not being seekable, by honoring byte-range requests in the proxy.
