---
'@rocket.chat/fuselage': patch
---

Preserved default classes on components built on plain elements (`Bubble`, `BubbleButton`, `BubbleItem`, `CardHeader`, `MessageContainer`, `MessageContainerFixed`, `MessageLeftContainer`) when `className` is passed, and omitted `className` in `StylingBox` when empty.
