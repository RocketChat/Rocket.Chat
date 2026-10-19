---
'@rocket.chat/fuselage': minor
---

Renders 40 components with Tamagui, among them `Button`, `InputBox`, `Item`, `Message`, `Sidebar`, `Modal`, `Table` and `Tabs`. It also adds `FuselageProvider`, which lets the Tamagui-based components under one React root share a single theme root.

Components keep their props, `rcx-*` class names, DOM and look. Their styles now live in the `fuselage` cascade layer: element resets placed in the `reset` layer stay below them, and any unlayered stylesheet still overrides them.
