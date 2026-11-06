---
'@rocket.chat/meteor': patch
---

Fixes servers that started while another server was running the database migrations, which kept the old values of the settings those migrations changed until they were restarted.
