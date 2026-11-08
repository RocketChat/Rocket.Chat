---
'@rocket.chat/ddp-client': minor
---

Adds the `inFlightMethods` option (`'reject'` by default, or `'resend'`) to choose whether method calls lost with the connection reject or are sent again after the reconnection's login, and the `logoutOnRefusedResume` option (`true` by default) to keep the account logged in when the server refuses the token after a reconnection. Only a refusal (a 401/403 answer) logs the account out; other failures of that login keep it. `connection.close()` now rejects every pending call.
