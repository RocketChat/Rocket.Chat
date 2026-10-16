---
'@rocket.chat/meteor': patch
---

Fixes `POST /api/v1/sendInvitationEmail` always responding with `{ "success": false }` even when every invitation email was sent successfully. The underlying `sendInvitationEmail` function was missing a `return true;` after its send loop, so it implicitly resolved to `undefined`, which the route handler coerced to `false` — misinforming API clients that the request had failed despite emails being delivered and the `Invitation_Email_Count` setting being incremented.
