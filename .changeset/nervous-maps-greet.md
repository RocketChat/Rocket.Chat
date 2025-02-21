---
"@rocket.chat/meteor": patch
"@rocket.chat/rest-typings": patch
---

Fixes `chat.update` endpoint, which allowed to update a message with an empty text. Now, the API will properly validate the message to contain at least one character.
