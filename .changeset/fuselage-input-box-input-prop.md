---
'@rocket.chat/fuselage': patch
---

Fixes `InputBox` ignoring its declared `input` prop and leaking it as an unrecognized attribute to the underlying DOM element
