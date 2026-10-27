---
'@rocket.chat/meteor': patch
---

Sends all server email, including password reset, enrollment and verification emails, through one SMTP transport that reuses connections across emails when the SMTP pool setting is on, instead of opening a new connection pool for every email, and rebuilds it when SMTP settings change. The `MAIL_URL` environment variable now configures that transport when the SMTP Host setting is empty, instead of being discarded at startup. When SMTP is not configured, emails are no longer printed to the server output in development mode, and password reset, enrollment and verification emails no longer fail in production; a warning is logged instead.
