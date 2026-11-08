---
'@rocket.chat/meteor': minor
---

Builds the web client with Vite and serves it from the server. The page, its runtime config, the CDN and path prefix, the Content-Security-Policy and the new-version notice work as before; the client's files are served from `/bundle/` with a long-lived cache. `yarn dev` now runs the Vite client in front of the local server.
