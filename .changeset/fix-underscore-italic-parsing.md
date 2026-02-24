---
'@rocket.chat/message-parser': patch
---

Fixes underscore-wrapped text containing dots or numbers (e.g., `_1.5_`, `_test.value_`) being incorrectly parsed as schemeless URLs instead of italic emphasis
