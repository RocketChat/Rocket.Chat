---
'@rocket.chat/meteor': patch
---

This adjustment removes the deprecated `Mailer.sendMail` and `Mailer:unsubscribe` methods. Moving forward, use the `mailer` and `mailer.unsubscribe` endpoints.
