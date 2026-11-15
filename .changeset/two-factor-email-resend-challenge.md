---
'@rocket.chat/core-typings': minor
'@rocket.chat/model-typings': minor
'@rocket.chat/models': minor
'@rocket.chat/meteor': minor
'@rocket.chat/i18n': minor
---

Limits two-factor authentication email codes to one for each user each minute. A password login that needs an email code now returns a `challengeId`, which clients can use to resend the code through `twoFactorChallenges.sendEmailCode`.
