---
'@rocket.chat/meteor': patch
---

Fixes Google Cloud Storage uploads failing to load in Chromium-based browsers when filenames contain commas, spaces, or other characters that require a quoted `Content-Disposition` value.

This fix applies to new uploads. Existing affected objects must be re-uploaded or have their `Content-Disposition` metadata repaired manually.
