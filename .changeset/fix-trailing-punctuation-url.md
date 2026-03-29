---
"@rocket.chat/message-parser": patch
---

Fixes trailing punctuation (e.g. periods, exclamation marks) being incorrectly included in parsed URLs when they appear at the end of a message. For example, `go to https://www.google.com.` now correctly parses the URL as `https://www.google.com` without the trailing period.
