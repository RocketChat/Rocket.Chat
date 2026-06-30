---
'@rocket.chat/meteor': patch
'@rocket.chat/core-typings': patch
---

Fixes REST API endpoints that require two-factor authentication (such as `users.update`) rejecting requests authenticated with a Personal Access Token created with "Ignore Two Factor Authentication", returning `totp-required` even though the token was meant to bypass the check. The two-factor authorization check now resolves the login token from the REST connection, so `bypassTwoFactor` tokens are honored again.
