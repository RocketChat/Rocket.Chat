---
'@rocket.chat/fuselage-ui-kit': patch
'@rocket.chat/meteor': patch
---

Fixes UiKit `icon_button` elements having no accessible name or tooltip: their `label` now names the button for screen readers and shows on hover.
