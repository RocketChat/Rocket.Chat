---
'@rocket.chat/apps': patch
---

Fix Apps runtime error response logging failing on non-object, primitive, array, or frozen error data, and prevent mutation of caller-supplied error data.
