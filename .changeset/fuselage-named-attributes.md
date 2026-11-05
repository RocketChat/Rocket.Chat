---
'@rocket.chat/fuselage': major
---

Makes `Button`, `IconButton`, `ButtonGroup`, `SplitButton`, `CheckBox`, `RadioButton`, `ToggleSwitch`, `Tag`, `Badge`, `Chip` and `Chevron` forward a fixed set of attributes to their element.

- They forward `className`, `id`, `title`, `ref`, `role`, `tabIndex`, every `aria-*` and `data-*` attribute, and the handlers react-aria's press, focus, hover and keyboard hooks hand a trigger. The input parts forward what forms and field labels hand an input.
- **Breaking changes:**
  - They no longer take `style`. Move it to a `className`.
  - Other HTML attributes their props type doesn't list, such as `onDoubleClick` or `lang`, are a type error and aren't forwarded.
