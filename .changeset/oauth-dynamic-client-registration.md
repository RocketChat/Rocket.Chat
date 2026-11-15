---
'@rocket.chat/i18n': minor
'@rocket.chat/meteor': minor
---

Adds Dynamic Client Registration (RFC 7591) to the OAuth2 server at `/oauth/register`, for MCP clients. It is behind the new "Allow dynamic client registration" setting on the MCP settings page, off by default, and like MCP it requires the Rocket.Chat AI add-on and MCP to be enabled. While it is off, registration requests get an error that explains what it needs.
