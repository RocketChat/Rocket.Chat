---
'@rocket.chat/meteor': patch
---

Trims whitespace from IP whitelist entries in failed-login protection to ensure whitelisted IPs with spaces after commas are not incorrectly blocked.
