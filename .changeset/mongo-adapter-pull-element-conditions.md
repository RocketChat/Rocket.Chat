---
'@rocket.chat/meteor': patch
---

Fixes `$pull` on local collections throwing on a condition such as `{ $gte: 20 }`, and emptying the array when given a regular expression or a date
