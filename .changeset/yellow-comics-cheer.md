---
'@rocket.chat/meteor': patch
---

Fixes an issue on the LDAP Background Sync where the process would stop syncing users if any of the LDAP users couldn't be properly mapped to a Rocket.Chat User (for example, by not having an email address)
