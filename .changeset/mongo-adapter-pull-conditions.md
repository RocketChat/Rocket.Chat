---
'@rocket.chat/mongo-adapter': patch
---

Fixes client-side `$pull` throwing on conditions such as `{ $gte: 20 }` or `{ $in: [...] }`, and removing every element when given a regular expression or a date
