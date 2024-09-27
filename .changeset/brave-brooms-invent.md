---
"@rocket.chat/meteor": patch
---

Fixes a problem that caused visitor creation to fail when GDPR setting was enabled and visitor was created via Apps Engine or the deprecated `livechat:registerGuest` method.
