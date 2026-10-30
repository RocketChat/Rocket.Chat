---
'@rocket.chat/meteor': patch
---

Fixes the `before:`, `after:` and `on:` message search filters using the wrong day boundaries when the user's time zone differs from the server's time zone
