---
'@rocket.chat/ddp-client': minor
---

Adds `encode`, `decode` and `WebSocket` options to `DDPSDK.create` and `DDPSDK.createAndConnect`, next to `retryCount` and `retryTime`, so clients can use EJSON or a custom WebSocket without reaching into the SDK internals. `LivechatClientImpl.create` and `RocketchatSdkLegacyImpl.create` share the same factory: they now also log in again after a reconnection, log the account out when the server refuses the token on that login, and send the account's credentials with REST calls.
