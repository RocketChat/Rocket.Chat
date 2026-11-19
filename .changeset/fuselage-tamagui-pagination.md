---
'@rocket.chat/fuselage': minor
---

Renders `Pagination` with Tamagui frames whose values name tokens and theme keys.

**Breaking for npm consumers**

- `Pagination` no longer accepts arbitrary HTML attributes or `style`. Besides its own props it takes `id`, `title`, `className`, `ref`, `testID`, `data-*`, `aria-*` and `onPress`.
- `onPress` is the press handler. `onClick` still works and is deprecated.
- The `sm` and `md` breakpoints of its layout are `600px` and `768px` instead of `37.5em` and `48em`: the same widths unless the browser's default font size was changed.
- The `--rcx-pagination-border-radius` custom property no longer styles the pagination, and the `rcx-pagination*` classes are not a public contract.
