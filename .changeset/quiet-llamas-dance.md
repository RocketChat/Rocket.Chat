---
"@rocket.chat/meteor": patch
---

Fixes LDAP excessive logging issue when Group BaseDN or Group Filter are not configured

When LDAP role/channel sync is enabled with "Validate membership for each group" strategy, but the
Group BaseDN or Group Filter settings are not configured, the system was logging an error for every
user and every LDAP group on every sync interval. This could result in thousands of log entries per
second, filling up ~1GB of logs per day.

This fix:
1. Adds early validation in `syncUserRoles` and `syncUserChannels` to check if BaseDN and Filter are
   configured before entering the iteration loop
2. Adds log throttling to the `isUserInGroup` function as a defense in depth measure
