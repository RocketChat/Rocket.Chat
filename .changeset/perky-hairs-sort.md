---
'@rocket.chat/meteor': patch
---

Fixes `im.create`/`dm.create` ignoring usernames that do not exist instead of failing with `error-invalid-user`, which allowed member-less direct message rooms to be created.