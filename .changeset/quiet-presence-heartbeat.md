---
'@rocket.chat/presence': patch
'@rocket.chat/meteor': patch
---

Fixes a regression since 8.6.0 where every presence heartbeat rewrote the user in the database and announced a status change to clients, apps, omnichannel and federation, even when the user's status had not changed. Idle connected users no longer cause database writes or status change events
