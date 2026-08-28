---
'@rocket.chat/models': patch
'@rocket.chat/meteor': patch
---

Fixes `POST /v1/banners.dismiss` failing with `Banner not found` for banners stored in the user's record (such as the version update ones), which were never marked as read. The endpoint now marks them as read as the deprecated `banner/dismiss` method did, and only fails when the banner does not exist in the banners collection nor in the user's record.
