---
'@rocket.chat/meteor': patch
---

Fixes the bad words filter turning off its non-Latin word matching when a listed word contains characters such as `+` or `(`, and matches listed words as literal text
