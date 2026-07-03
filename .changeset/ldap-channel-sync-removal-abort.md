---
'@rocket.chat/meteor': patch
---

Fixes LDAP channel sync aborting the entire add/removal pass when a mapped channel could not be resolved, which prevented users from being removed from channels when "Auto Remove Users from Channels" was enabled.
