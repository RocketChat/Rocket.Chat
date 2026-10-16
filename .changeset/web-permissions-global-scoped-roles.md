---
'@rocket.chat/meteor': patch
---

Fixes the web app ignoring roles with the *Rooms* scope (such as `owner`, `moderator`, `leader`, or any custom role with that scope) when they are assigned to a user globally, in *Administration → Users*, instead of in a specific room. The web app now grants the permissions of these roles in every room, as mobile and the API already do. A role assigned in a single room still applies only to that room.
