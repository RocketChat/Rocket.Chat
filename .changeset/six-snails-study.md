---
"@rocket.chat/meteor": patch
---

Fixes a behavior of the mentions parser that identified mentions inside markdown links text. Now, these components will be removed from the text before trying to parse mentions.
