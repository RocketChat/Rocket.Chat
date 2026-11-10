---
'@rocket.chat/fuselage': minor
---

Fuselage components no longer accept `Box` styling props. Their props are now the DOM and ARIA attributes of the element they render plus the variations each component declares, so TypeScript rejects `margin*`, `width`, `flexGrow`, `fontScale`, `color` and the other `Box` styling props, a free `is`, and a `className` built with `css` or passed as an array (it must be a string; `useStyle` turns a `css` style into one). `rcx-*` props are not part of any component's API either. To lay out or style a component, place it in a `Box` (a container with `gap`, or a wrapper) or use one of the component's own variations. `Box`, `Flex`, `Margins` and `Scrollable` keep accepting styling props.

Some components swap a styling prop they used to read for a named variation:

- `Contextualbar` takes `stretch` instead of `width='100%'`, no longer takes `backgroundColor`, and its `position` is one of `static`, `relative`, `absolute` or `fixed`.
- `ModalFooter` takes `justify` instead of `justifyContent`, and `ModalIcon` takes `align` instead of `alignItems`.
- `Tile` takes `flush` instead of `padding`.
- `Modal` keeps `width` and `height` and also takes `maxHeight`; `Options` keeps `maxHeight`; `Tile` keeps `elevation`; `Throbber` and `ModalIcon` keep `size`; `InputBox` keeps `invisible`.
- `Select`, `PaginatedSelect` and `PaginatedMultiSelect` take `name`.
