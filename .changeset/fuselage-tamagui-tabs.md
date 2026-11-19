---
'@rocket.chat/fuselage': minor
---

Renders `Tabs` and `TabsItem` with Tamagui frames whose values name tokens and theme keys.

**Breaking for npm consumers**

- `Tabs` and `TabsItem` no longer accept arbitrary HTML attributes or `style`. `Tabs` takes `id`, `title`, `className`, `ref`, `testID`, `data-*`, `aria-*` and `onPress`; `TabsItem` takes what a button takes: the same, plus `role`, `name`, `value`, `tabIndex` and the keyboard, focus and pointer handlers.
- `onPress` is the press handler. `onClick` still works and is deprecated.
- The `--rcx-tabs-*` custom properties no longer style the tabs, and the `rcx-tabs*` classes are not a public contract.
