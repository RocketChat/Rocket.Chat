---
'@rocket.chat/meteor': minor
---

Deprecates the `logoutCleanUp` DDP method and stops the client from calling it. The post-logout side effects (`afterLogoutCleanUpCallback` + `Apps.IPostUserLoggedOut`) now run server-side via a new `Accounts.onLogout` handler and from `POST /v1/users.logout`, so both DDP and REST logout paths fire them without a client round-trip. The DDP method keeps its original implementation and registration with a deprecation log pointing at `/v1/users.logout` until 9.0.0.
