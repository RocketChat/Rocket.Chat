---
'@rocket.chat/meteor': patch
---

Fixes `rooms.bannedUsers` ignoring the `count` and `offset` pagination parameters and fetching every banned subscription with full documents on each call. Also fixes an invalid `projections` option (typo for `projection`) that caused the private group lookup helper and `rooms.hide` to fetch nearly the entire user document on every request.
