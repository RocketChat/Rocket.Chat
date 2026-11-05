---
'@rocket.chat/tools': patch
---

fix: Redact additional sensitive query parameters (`token`, `secret`, `password`, `apiKey`, `auth_token`, `authorization`, `code`) and sanitize relative URLs in `censorUrl`
