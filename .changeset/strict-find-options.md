---
'@rocket.chat/meteor': patch
'@rocket.chat/model-typings': patch
---

Fixes broken pagination on `rooms.bannedUsers` and on omnichannel department listing endpoints, which ignored the `offset` parameter and always returned results from the first page. Also reduces payload over-fetching on several endpoints that unintentionally loaded full documents (`rooms.hide`, private group lookups, direct email replies, omnichannel auto-transfer), and removes the permissive model query typings that allowed these invalid find options to compile unnoticed.
