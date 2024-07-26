---
"@rocket.chat/meteor": patch
"@rocket.chat/i18n": patch
---

Added a new Audit endpoint `audit/rooms.members` that allows users with `view-members-list-all-rooms` to fetch a list of the members of any room even if the user is not part of it. 
