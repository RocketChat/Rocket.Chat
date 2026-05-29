---
'@rocket.chat/meteor': minor
---

Moved the post-logout cleanup hook (`afterLogoutCleanUpCallback` + `Apps.IPostUserLoggedOut`) into a server-side `Accounts.onLogout` handler and into `POST /v1/users.logout`. Both DDP and REST logout paths now fire those callbacks server-side; the client no longer needs to invoke `logoutCleanUp` after detecting a logout, and the deprecated DDP method keeps its registration with a deprecation log pointing at `/v1/users.logout`.
