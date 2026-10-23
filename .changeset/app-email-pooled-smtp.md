---
'@rocket.chat/meteor': patch
---

Reuses SMTP connections across emails when the SMTP pool setting is on, instead of opening a new connection pool for every email, and rebuilds them when SMTP settings change. When SMTP is not configured, emails are no longer printed to the server output in development mode; a warning is logged instead. Password reset, enrollment and verification emails are not affected.
