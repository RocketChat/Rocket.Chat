---
'@rocket.chat/meteor': patch
---

Fixes auto-translation splitting a mention or channel link when another mentioned username or channel name starts with the same letters, which sent part of the name to the translator
