---
'@rocket.chat/meteor': minor
---

Serves HTTP and the DDP WebSocket from the server's own HTTP server instead of Meteor's. The REST API, webhooks, federation, health probes and the DDP endpoints are answered directly; pages and files still served by Meteor work as before, with the same security headers. DDP behaves as it does in microservices deployments: only the websocket transport is served (`/sockjs` xhr and polling answer 404), every method call and subscription counts against the DDP rate limits, and the `stream-*` methods are no longer reachable through the REST `method.call` endpoints.
