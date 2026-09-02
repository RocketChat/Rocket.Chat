---
'@rocket.chat/media-calls': patch
'@rocket.chat/meteor': patch
---

Fixes the `createdBy` of a voice call being stored with no contact information on it: every call that was not created by a transfer ended up with a `createdBy` carrying only the requester's id, while the caller and callee carried their username and display name. This also affected the `transferredBy` reported to clients.
