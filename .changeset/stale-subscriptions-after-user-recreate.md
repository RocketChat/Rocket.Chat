---
'@rocket.chat/meteor': patch
---

Fixes the session left behind when the logged-in user's account is deleted: the browser now logs out cleanly, so logging back in as a recreated user no longer fails on the first attempt nor shows duplicated channels in the sidebar
