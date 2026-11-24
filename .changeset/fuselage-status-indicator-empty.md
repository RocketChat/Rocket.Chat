---
'@rocket.chat/fuselage': patch
---

`MessageStatusIndicator` renders nothing when it has no children, instead of an empty element hidden with `:empty`.
