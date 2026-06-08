---
'@rocket.chat/meteor': patch
---

Persists attachment collapsed/expanded state across channel switches using sessionStorage, preventing collapsed images and media from re-expanding when the user navigates away and returns to a channel.
