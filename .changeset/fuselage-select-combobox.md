---
'@rocket.chat/fuselage': minor
'@rocket.chat/meteor': patch
---

Rebuilds `Select` as a select-only combobox: a `label` pointing at its `id` now names it, as it names any other input, and its popup list is named after it. `Select` no longer accepts React Aria's select props, such as `isDisabled`, `selectedKey`, `onSelectionChange`, `isOpen`, `onOpenChange` and `disabledKeys`; use `disabled`, `value` and `onChange`
