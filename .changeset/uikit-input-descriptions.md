---
'@rocket.chat/fuselage-ui-kit': patch
'@rocket.chat/meteor': patch
---

Fixes UiKit input block hints and errors not being announced with text, date, time and multi-select inputs. Screen readers used to read only the label and did not report invalid fields.
