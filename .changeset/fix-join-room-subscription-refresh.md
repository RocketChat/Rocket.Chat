---
'@rocket.chat/meteor': patch
---

Fixed the "not subscribed" room screen not updating after joining a room. The join mutation invalidated a stale React Query key that no longer matched the open-room query, so the UI kept showing the join prompt until a manual page refresh. It now invalidates the correct `rooms` reference key, so the room opens immediately after joining.
