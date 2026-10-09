---
'@rocket.chat/meteor': minor
'@rocket.chat/site-replication': minor
---

Adds active-active replication between two sites, each with its own database. Both sites keep working while the link between them is down, and converge when it returns; messages both sites posted to the same room in the meantime are grouped into one thread per site. Enabled by setting `SITE_REPLICATION_PEER_URL` and related variables.
