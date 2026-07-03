---
'@rocket.chat/meteor': patch
---

Fixes multiple business hours losing their linked departments after a daylight saving time change or a server restart. The automatic timezone adjustment re-saved business hours without their department associations, causing business hours configured with timezones to silently stop applying to agents.
