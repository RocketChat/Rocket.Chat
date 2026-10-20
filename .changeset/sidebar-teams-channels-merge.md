---
'@rocket.chat/meteor': minor
'@rocket.chat/rest-typings': minor
---

Adds two sidebar grouping user preferences:

- `sidebarGroupTeamsAndChannels`: merges the Teams and Channels sidebar groups into a single "Teams and channels" category when grouping by type is enabled.
- `sidebarGroupUnlistedInConversations`: routes rooms whose group is not part of the visible sidebar sections into "Conversations" instead of dropping them from the sidebar.
