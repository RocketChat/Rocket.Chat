---
'@rocket.chat/fuselage': patch
---

Restrict `AnimatedVisibility` children to a single element and document that it must render a `Box`, since other content never finishes hiding and stays mounted
