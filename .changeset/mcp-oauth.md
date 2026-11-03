---
'@rocket.chat/meteor': minor
---

Lets MCP clients connect to `/api/v1/mcp` with OAuth: the endpoint accepts access tokens from the workspace's OAuth2 server in addition to Personal Access Tokens, answers unauthenticated requests with a `WWW-Authenticate` challenge, and serves protected resource metadata (RFC 9728) at `/.well-known/oauth-protected-resource/api/v1/mcp`
