---
'@rocket.chat/mongo-adapter': patch
---

Fixes client-side equality treating dates, binary values, arrays and regular expressions as equal to an empty object (or to any other regular expression)
