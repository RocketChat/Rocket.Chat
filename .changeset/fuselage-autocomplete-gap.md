---
'@rocket.chat/fuselage': minor
---

`AutoComplete` and `MultiSelect` space their input and selected items with a 4px gap instead of wrapping them in `Margins`, so a `renderSelected` item no longer needs to forward its class name or bring its own margin to be spaced.
