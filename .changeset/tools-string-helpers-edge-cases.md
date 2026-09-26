---
'@rocket.chat/tools': patch
'@rocket.chat/meteor': patch
---

Fixes HTML entity unescaping turning names like `&toString;` into function source and garbling numeric entities above U+FFFF, such as emoji, and fixes the string helpers throwing on symbols and turning `0` and `false` into empty strings
