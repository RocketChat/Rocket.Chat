---
'@rocket.chat/apps-engine': minor
'@rocket.chat/http-router': minor
'@rocket.chat/meteor': minor
---

Introduces an internal ServerEndpoints bridge and accessor to call API v1 routes in-memory, enabling Apps Engine to reuse REST endpoints without HTTP and to act as the calling user securely via short‑lived impersonation tokens, by dispatching through the v1 Hono router and gating usage behind new server-endpoints.call and server-endpoints.impersonate permissions.
