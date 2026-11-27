---
'@rocket.chat/meteor': minor
---

Adds the `rooms.sendFile` endpoint and exposes it as an MCP tool when the extended MCP API is enabled, so agents can upload a file and post it to a room or thread in one call. The file can have up to 10 MiB, or up to the workspace maximum file size when that is lower
