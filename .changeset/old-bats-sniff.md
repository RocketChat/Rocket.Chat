---
'@rocket.chat/apps-engine': patch
'@rocket.chat/meteor': patch
---

Fixes wrong FederationLookup type assigned to IUser in apps. The correct data is there, but the type does not represent it.
