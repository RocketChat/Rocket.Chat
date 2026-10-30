---
'@rocket.chat/meteor': minor
'@rocket.chat/rest-typings': minor
---

Add `GET /api/v1/e2e.fetchMyPublicKey` for authenticated users. The endpoint returns only their E2EE public key, or `null` if no key exists. It does not return a private key.
