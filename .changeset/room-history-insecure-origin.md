---
'@rocket.chat/meteor': patch
---

Fix message history loading on non-secure HTTP origins where `crypto.randomUUID` is unavailable.
