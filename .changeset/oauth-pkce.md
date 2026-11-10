---
'@rocket.chat/core-typings': minor
'@rocket.chat/meteor': minor
---

Adds PKCE (RFC 7636, `S256`) to the OAuth2 server: an authorization code keeps the client's code challenge, and the token request must carry the matching code verifier. The token endpoint keeps requiring the client secret with PKCE.
