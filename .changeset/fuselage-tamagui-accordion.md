---
'@rocket.chat/fuselage': minor
---

Renders `Accordion` and `AccordionItem` with Tamagui frames whose values name tokens and theme keys.

**Breaking for npm consumers**

- `Accordion` and `AccordionItem` no longer accept arbitrary HTML attributes or `style`. Besides their own props they take `id`, `className`, `ref`, `testID`, `data-*` and `aria-*`, and `Accordion` also takes `title`.
- The `rcx-accordion*` classes are not a public contract.
