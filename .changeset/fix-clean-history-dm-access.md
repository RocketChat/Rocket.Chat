---
"@rocket.chat/meteor": patch
---

Fix `rooms.cleanHistory` API and method rejecting admin users from cleaning DM room history when they have the `clean-channel-history` permission.
