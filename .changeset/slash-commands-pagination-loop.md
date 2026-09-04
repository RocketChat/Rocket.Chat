---
'@rocket.chat/meteor': patch
---

Fixes an endless stream of `commands.list` requests when `API_Upper_Count_Limit` is lower than 50. The client paginated the slash command list in steps of 50 regardless of how many items the server actually returned, so the list never reached the reported total and the requests never stopped.
