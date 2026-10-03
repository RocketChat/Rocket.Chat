---
'@rocket.chat/meteor': patch
---

Fixed REST API `POST /api/v1/sendInvitationEmail` returning `success: false` by ensuring `sendInvitationEmail` resolves with a boolean and returns `true`.
