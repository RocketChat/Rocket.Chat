---
"@rocket.chat/meteor": patch
"@rocket.chat/ddp-client": patch
---

Fixed a problem where chained callbacks' return value was being overrided by some callbacks returning something different, causing callbacks with lower priority to operate on invalid values
