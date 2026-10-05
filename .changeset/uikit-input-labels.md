---
'@rocket.chat/fuselage-ui-kit': patch
'@rocket.chat/meteor': patch
---

Fixes UiKit input block labels not being associated with their fields, so screen readers announced text, date and time inputs without a name and clicking the label did not focus the field.
