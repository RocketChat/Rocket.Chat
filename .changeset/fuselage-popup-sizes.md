---
'@rocket.chat/fuselage': minor
'@rocket.chat/meteor': patch
---

The option lists, the selects and `Menu` size their popups without Box styling props, inline `style` or CSS custom properties. Their look is unchanged.

`Position` and `PositionAnimated` take `width='anchor'`, which gives the element they place the width of its anchor and keeps it as the anchor resizes. `Select`, `SelectLegacy`, `MultiSelect`, `AutoComplete`, `PaginatedSelect` and `PaginatedMultiSelect` use it instead of measuring their box and handing the width to their options.

### Breaking for npm consumers

- `Options`: `maxHeight` is a closed set, `'x144'` (the default), `'x200'` or `'max-content'`. It took any Box size before.
- A component passed as `renderOptions` no longer receives `width`: the width of the popup arrives in the `style` the placement hands it, with its position.
- `Menu`: `maxWidth` is a closed set, `'x250'` (the default) or `'full'`. It took any Box size before.
- `Listbox` resets its margin and padding through its own `rcx-listbox` class.
