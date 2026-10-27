---
'@rocket.chat/meteor': minor
'@rocket.chat/rest-typings': minor
---

Adds the `GET /api/v1/e2e.fetchMyPublicKey` endpoint. It returns only the end-to-end encryption public key of the authenticated user, and never a private key. A client that must only compare the public key (for example, the desktop app's local search of encrypted messages) can use it instead of `e2e.fetchMyKeys`, which also returns the encrypted private key.
