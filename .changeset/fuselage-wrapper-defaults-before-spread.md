---
'@rocket.chat/fuselage': patch
---

Fixes `StatesIcon` ignoring its `size`, and `MessageMetricsFollowing` and `MessageMetricsReply` ignoring `small`, because their defaults came after the props they were given.
