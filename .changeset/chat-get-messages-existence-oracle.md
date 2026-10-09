---
'@rocket.chat/meteor': patch
---

Fixes `chat.getMessages` and the deprecated `getMessages` method responding differently for a message id the caller cannot access than for a nonexistent one, which let any authenticated user probe whether a given message id exists inside rooms they are not a member of. Messages in inaccessible rooms are now omitted from the result exactly like nonexistent ids.
