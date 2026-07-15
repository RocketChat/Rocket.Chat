---
"@rocket.chat/meteor": patch
---

Use relative URLs for avatar images to prevent cross-origin canvas tainted errors when protocols differ (HTTP/HTTPS). Also add `crossOrigin: anonymous` to canvas-based avatar conversion.
