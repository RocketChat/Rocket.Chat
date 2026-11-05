---
'@rocket.chat/apps-engine': patch
---

Apps now get an error when they try to open or update a modal or contextual bar, or show view errors, from an interaction that has no trigger. Before, Rocket.Chat silently ignored these responses.
