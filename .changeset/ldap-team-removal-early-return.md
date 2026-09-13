---
'@rocket.chat/meteor': patch
---

Makes LDAP team removal run independently of team additions, so a user removed from a mapped LDAP group is removed from the corresponding team even when the sync has no teams to add
