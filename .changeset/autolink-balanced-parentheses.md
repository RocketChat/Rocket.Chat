---
'@rocket.chat/message-parser': patch
---

Fixes links whose address ends with a parenthesized part, such as Wikipedia's `Mercury_(planet)`, losing their closing parenthesis and pointing to the wrong page
