---
'@rocket.chat/models': patch
'@rocket.chat/model-typings': patch
'@rocket.chat/meteor': patch
---

Fixes endpoints `omnichannel/contacts.update` and `omnichannel/contacts.conflicts` where the contact manager field could not be cleared.
