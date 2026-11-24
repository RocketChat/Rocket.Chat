---
'@rocket.chat/meteor': patch
---

Fixes Search Messages results showing "This message could not be displayed" instead of the message when the search text contains characters such as `+`, `(`, `*` or `\`, for example `c++`. The search text is now highlighted in the results exactly as typed.
