---
'@rocket.chat/meteor': patch
---

Fixes multiple business hours losing their linked departments after a daylight saving time change or a server restart. The automatic timezone adjustment re-saved business hours without their department associations, causing business hours configured with timezones to silently stop applying to agents.

Also fixes agents keeping a business hour's availability after their department was removed from it: saving a business hour with a smaller department list unlinked the departments but never cleared the business hour from the removed departments' agents.
