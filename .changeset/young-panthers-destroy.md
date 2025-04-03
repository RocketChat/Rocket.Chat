---
"@rocket.chat/meteor": patch
"@rocket.chat/core-typings": patch
"@rocket.chat/models": patch
---

Fixes multiple issues with the "Maximum allowed amount of chats a user can handle simultaneously" feature, which caused: agents being selected when they shouldn't and agents being able to take more (or less) chats because of how we applied the limits.

After this fix, the priority for these limits will be as follows: Agent > Department > Global. This means, if the global limit is 3 but specific agent's limit is 5, then _that agent_ will be able to take 5 chats, and so on.
