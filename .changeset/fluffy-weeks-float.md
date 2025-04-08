---
"@rocket.chat/meteor": patch
---

Fixes an error causing the server to throw an "unhandled promise rejection" when removing an agent from a department without a business hour when using `Multiple` business hours
