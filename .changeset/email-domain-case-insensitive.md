---
'@rocket.chat/meteor': patch
---

Fixed case-sensitive email domain validation so domains are matched case-insensitively (per RFC 5321) against the configured allowed and blocked domain lists
