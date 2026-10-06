---
'@rocket.chat/apps-engine': patch
---

Correct the user-deletion handler interface to require `executePostUserDeleted`, matching the event dispatched by the listener manager. Apps implementing the deletion hook no longer have to implement the unrelated user-creation hook.
