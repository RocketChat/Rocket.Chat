---
'@rocket.chat/message-parser': patch
---

Fixes a period at the end of a sentence being included in a user or channel mention (e.g. "thanks @john." mentioned "john." instead of "john")
