---
"@rocket.chat/meteor": patch
---

chore: Increase cache time from 5s to 10s on `getUnits` helpers. This should reduce the number of DB calls made by this method to fetch the unit limitations for a user.
