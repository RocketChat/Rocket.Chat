---
'@rocket.chat/meteor': patch
---

Keeps decrypted last messages from end-to-end encrypted rooms out of the client's persistent cache. Rewrites caches that older clients left on disk. Preserves server file-deletion markers only before decryption. Prevents startup rewrites and delayed saves from restoring cached records after logout.
