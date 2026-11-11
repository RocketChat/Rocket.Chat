---
'@rocket.chat/fuselage': minor
---

Removes the Box styling props from `Accordion` and `AccordionItem`. Neither is rendered through `StylingBox` any more; `AccordionItem` still forwards `className` and any other attribute to its `section`.

### Breaking for npm consumers

- `Accordion` no longer accepts Box styling props (`margin`, `padding`, `width`, ...). Wrap it in a layout element instead.
- `AccordionItem` no longer accepts Box styling props.
