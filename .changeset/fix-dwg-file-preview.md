---
'@rocket.chat/meteor': patch
---

Fixes preview generation for vendor-specific image formats like `.dwg` (AutoCAD) files. Files with MIME types such as `image/vnd.dwg` and `image/vnd.microsoft.icon` are now excluded from preview generation as they cannot be processed by the Sharp image library, preventing failed preview attempts.
