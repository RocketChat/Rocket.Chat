---
'@rocket.chat/meteor': patch
---

Improve performance of mentioned and starred messages endpoints by replacing sequential `await` calls with concurrent `Promise.all` for independent `Users` and `Rooms` database lookups. Affected endpoints: `chat.getMentionedMessages`, `chat.getStarredMessages`.. 