---
'@rocket.chat/meteor': patch
---

Fixes the importer rewriting mentions of other users and channels whose names start with an imported one, that only match it because of a dot, or that are on another server, and rewriting a name it had just inserted for another mention
