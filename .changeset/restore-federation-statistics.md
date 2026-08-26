---
'@rocket.chat/model-typings': minor
'@rocket.chat/core-typings': minor
'@rocket.chat/models': minor
'@rocket.chat/meteor': minor
---

Restores federation metrics in the workspace statistics that were lost in the migration to native federation: `externalConnectedServers` now reports the remote homeservers the workspace has federated with (it was always empty before) and a new `amountOfFederationEvents` field reports the total volume of federation events processed. The `amountOfExternalUsers` count now only includes native federation users, no longer counting stale users left behind by the removed matrix-bridge federation.
