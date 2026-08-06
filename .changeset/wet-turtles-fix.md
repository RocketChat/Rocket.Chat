---
'@rocket.chat/meteor': patch
---

Fixes reaction list modal showing blank entries (mobile) or usernames (web) instead of real names when `UI_Use_Real_Name` is enabled. The broadcast pipeline now enriches reactions with display names via batch query.
