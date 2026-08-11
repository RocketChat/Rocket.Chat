---
'@rocket.chat/message-parser': patch
---

Fixes `<t:...>` timestamps with dates on or after 2038-01-19 rendering as a wrong (1903) date. The parser truncated the epoch seconds with `| 0`, which overflows the 32-bit signed range; it now uses `Math.floor`, so future dates parse correctly.
