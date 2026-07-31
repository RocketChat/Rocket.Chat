---
'@rocket.chat/meteor': patch
---

Stops the importers from storing the `name` and `username` of the message sender as `null` on imported messages when the imported user doesn't have them
