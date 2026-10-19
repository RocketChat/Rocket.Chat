---
'@rocket.chat/fuselage': minor
---

Renders `Divider` with Tamagui and adds `FuselageProvider`, which lets the Tamagui-based components under one React root share a single theme root. `Divider` keeps its props, its `rcx-divider*` class names and its look; its styles now live in the `fuselage` cascade layer, so element resets placed in the `reset` layer stay below them while any unlayered stylesheet still overrides them
