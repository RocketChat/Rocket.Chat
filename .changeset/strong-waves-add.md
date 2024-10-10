---
"@rocket.chat/meteor": patch
---

Fixes an issue where a user may receive an indefinite amount of "suggested keys" from all the users on a room even when a user already suggested a key for them, duplicating the work on server.

Now, the endpoint that returns users waiting for keys will return only users that don't have neither `E2EKey` nor `E2ESuggestedKey`.
