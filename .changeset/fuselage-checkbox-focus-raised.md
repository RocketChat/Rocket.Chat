---
'@rocket.chat/fuselage': minor
---

`CheckBox` raises its focused fake above its siblings (`z-index: 1`) so the focus ring is never clipped; `Message` no longer styles `CheckBox` internals for task lists.
