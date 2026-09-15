---
'@rocket.chat/meteor': patch
---

Fixes message search returning messages from rooms the searching user cannot access. The cache that memoizes the per-room access check was keyed only on the room id, so the first user to search a room decided the outcome for everyone who searched it afterwards. The cache is now keyed on both the room and the user, and expires, so revoked access takes effect.
