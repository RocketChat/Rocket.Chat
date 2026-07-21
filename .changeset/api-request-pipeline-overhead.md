---
'@rocket.chat/meteor': patch
---

Reduces per-request overhead in the REST API pipeline: the tracing middleware no longer clones the request (or builds span metadata) when tracing is disabled, the request logger skips building a child logger when the http log level is disabled, the router no longer clones the request body for every call, unauthenticated requests no longer hash a login token, the rate limiter only checks the bypass permission after the limit is exceeded, permission checks reuse the roles already loaded during authentication instead of re-fetching them, and the Express authentication path (Apps-Engine/OAuth) now fetches the user with a projection. Also parallelizes several independent database calls in rooms.info, chat thread listings, teams, integrations, roles.sync, push.get and the engagement dashboard period queries.
