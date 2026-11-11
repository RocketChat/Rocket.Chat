---
'@rocket.chat/fuselage': minor
'@rocket.chat/meteor': patch
---

Sizes `Options` and `OptionsPaginated` through custom properties instead of Box styling props, and moves the scroll container, `Listbox` margins and the select anchors' ordering into the stylesheet. Nothing changes visually.

**Breaking for npm consumers:**

- `Menu` `maxWidth` is now any CSS length (`'100%'`, `'20rem'`) instead of a Box size token, so `'x300'` is no longer understood.
- `Options` `maxHeight` is now a number of pixels or any CSS length (`200`, `'max-content'`, `'12rem'`) instead of a Box size token, so `'x200'` is no longer understood.
- `Options` and `OptionsPaginated` take `width` explicitly (a number of pixels or any CSS length) instead of through Box styling props.
- `Options` and `OptionContainer` no longer render through `Scrollable`; the list element scrolls itself.
