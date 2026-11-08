---
'@rocket.chat/federation-matrix': patch
'@rocket.chat/meteor': patch
---

Fixes the Matrix federation answering every `/.well-known` path with an error, which hid other discovery documents the workspace serves there
