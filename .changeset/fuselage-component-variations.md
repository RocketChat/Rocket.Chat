---
'@rocket.chat/fuselage': minor
---

Adds the component variations and the hook that replace Box styling props on Fuselage components:

- `TableCell` accepts `truncate`, which keeps its content on one line cut with an ellipsis, `color='default' | 'hint'`, and `strong`, which renders the text in the medium weight.
- `Contextualbar` accepts `stretch`, which makes it as wide as its container.
- `ContextualbarContent` accepts `flush`, which drops its inline padding, and `spaced`, which adds a 12px block padding.
- `ModalFooter` accepts `justify='space-between'`, and `ModalIcon` accepts `align='end'`.
- `Table` `columns` take pixel and percentage widths (`'150px'`, `40`, `'20%'`) besides Fuselage sizes.
- `useStyle` is exported: it turns a style built with `css` into a class name, for a `className` that takes strings only.
