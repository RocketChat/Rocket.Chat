---
'@rocket.chat/model-typings': minor
'@rocket.chat/models': minor
---

Removes unused model query methods and the dead FederationEvents/FederationRoomEvents models; adds `Rooms.unsetAllAbacAttributes` to replace a direct `updateMany` call in the ABAC service
