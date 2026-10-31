---
'@rocket.chat/message-parser': patch
---

Improve mention parsing to support colons and dots in federated usernames (e.g., `@user:server.org`), and normalize leading-@ handling to avoid duplicate `@` characters during fallback parsing.