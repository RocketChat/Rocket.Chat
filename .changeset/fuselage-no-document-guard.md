---
'@rocket.chat/fuselage': patch
---

Fixes `useStyle` and `PaletteStyleTag` throwing where there is no `document`, as in React Native. Both now do nothing there; with a `document` nothing changes.
