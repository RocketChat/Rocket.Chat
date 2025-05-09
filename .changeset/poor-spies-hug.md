---
"@rocket.chat/pdf-worker": patch
---

Fixes an issue with PDF generation process that caused the server to hang when a single message consisted of too many (+30) markdown elements and was followed and preceded by more messages.
