---
"@rocket.chat/meteor": patch
---

fix: Show always all rooms when requesting chat history, even unserved ones. A faulty condition caused an issue where chat history was only able to present either served or unserved chats at once, without a proper way to get both. Now, the Chat history feature will showcase all closed rooms for the requested visitor.
