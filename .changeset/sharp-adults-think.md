---
"@rocket.chat/meteor": minor
---

Fixes the departments filter on the omnichannel current chats page by ensuring that the selected department is fetched and 
added if it was not part of the initial department list. This prevents the filter from becoming blank and avoids potential 
UX issues.
