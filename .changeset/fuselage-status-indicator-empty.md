---
'@rocket.chat/fuselage': minor
---

`MessageStatusIndicator` renders nothing when it has no children, instead of an empty element hidden with `:empty`; `MessageStatusIndicatorItem` sets its own `secondary-info` color (a consumer `color` still wins).
