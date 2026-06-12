---
'@rocket.chat/apps': patch
---

Replaces {} with Object.create(null) to ensure defense-in-depth against prototype pollution
