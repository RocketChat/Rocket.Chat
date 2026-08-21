---
'@rocket.chat/meteor': patch
---

Fixed app action buttons never matching a role scoped to `Subscriptions` — `owner`, `moderator`, `leader`, or a custom one. The room was not being passed as the scope of the role check, so a button filtered by one of those roles stayed hidden even for a user who held it in the room.
