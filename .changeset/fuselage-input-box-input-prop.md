---
'@rocket.chat/fuselage': minor
---

Removes the unused `input` prop from `InputBoxProps`. `InputBox` never rendered it and passed it on to the underlying element as an unknown attribute.
