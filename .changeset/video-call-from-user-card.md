---
'@rocket.chat/meteor': minor
---

Video calls from the user card, user info and members list no longer require an existing direct message: one is created on demand, for both the call window and the call popup. The action isn't offered to federated users, since calls don't work over federation.
