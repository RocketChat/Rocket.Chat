---
'@rocket.chat/ddp-client': minor
'@rocket.chat/meteor': patch
---

Add `oauth` namespace to `@rocket.chat/ddp-client` (`launchLogin`, `stateParam`, `resolveLoginStyle`, `showPopup`) so OAuth popup/redirect handshake helpers no longer depend on the `meteor/oauth` package on the client.
