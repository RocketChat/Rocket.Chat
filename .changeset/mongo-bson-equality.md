---
'@rocket.chat/mongo-adapter': patch
---

Compare BSON value types and regular expression contents when evaluating equality, preventing unrelated empty objects, dates, arrays, and binary values from matching.
