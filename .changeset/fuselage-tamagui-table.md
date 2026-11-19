---
'@rocket.chat/fuselage': minor
---

Renders the `Table` family (`Table`, `TableHead`, `TableBody`, `TableFoot`, `TableRow`, `TableCell`, `TableSelection`) with Tamagui frames whose values name tokens and theme keys.

**Breaking for npm consumers**

- The parts no longer accept arbitrary HTML attributes or `style`. Besides its own props each takes `id`, `title`, `role`, `tabIndex`, `className`, `ref`, `testID`, `data-*`, `aria-*` and `onPress`; `TableRow` and `TableCell` also take the keyboard, focus and pointer handlers, and `TableCell` takes `colSpan`, `rowSpan`, `headers` and `scope`.
- `onPress` is the press handler. `onClick` still works and is deprecated.
- A column width off the size scale is set as the `width` attribute of its `col` element, in pixels, and the `--rcx-table-col-width` custom property is gone.
- The `rcx-table*` classes are not a public contract.
