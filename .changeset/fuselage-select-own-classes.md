---
'@rocket.chat/fuselage': minor
'@rocket.chat/meteor': patch
---

`Select`, `AutoComplete` and the select anchors no longer borrow the classes of `InputBox`. `Select` and `AutoComplete` get their own box styles, and `Input` takes an `undecorated` prop for an input that sits inside another control. Nothing changes visually.

**Breaking for npm consumers:**

- A control that put `rcx-input-box--undecorated` or `rcx-input-box--small` in `className` to look like part of a select should use `<Input undecorated />` instead, or its own styles.
- The `.rcx-autocomplete` root no longer takes the `rcx-select--invalid` and `rcx-select--disabled` classes; it uses `rcx-autocomplete--invalid` and `rcx-autocomplete--disabled`.
- `.rcx-autocomplete` is no longer matched by selectors written for `.rcx-select`.
