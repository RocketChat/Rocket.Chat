---
'@rocket.chat/meteor': patch
'@rocket.chat/rest-typings': patch
---

Fixes encrypted rooms that have a room key ID but no member with a usable room key. The client sends the key ID with its encrypted room key in one request. The server validates the creator's subscription and saves both keys in a MongoDB transaction. It sends change notifications only after the transaction commits. Failed writes do not leave a partial key state. Clients that omit the optional `key` keep the earlier behavior.
