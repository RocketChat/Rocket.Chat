---
'@rocket.chat/memo': patch
---

Fixes `clear` rejecting, at the type level, memoized functions whose argument has a type other than `unknown`
