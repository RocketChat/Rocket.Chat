---
'@rocket.chat/fuselage': minor
---

`ThreadMessageUnfollow` is renamed to `ThreadMessageFollowIndicator` and accepts a `following` prop: it shows a bell when `true` and a crossed-out bell when `false` (the default, matching the previous icon).
