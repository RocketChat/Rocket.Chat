---
"@rocket.chat/message-parser": patch
---

Fixed parsing of timestamps without a timezone (e.g. `<t:10:30>`) displaying as Unix epoch (1 January 1970).
