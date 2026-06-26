---
'@rocket.chat/meteor': patch
---

Improve performance of thread-related chat endpoints by replacing sequential `await` calls with concurrent `Promise.all` for independent `Users` and `Rooms` database lookups. Affected endpoints: `chat.getThreadsList`, `chat.syncThreadsList`, `chat.getThreadMessages`, `chat.syncThreadMessages`.
