---
'@rocket.chat/fuselage': minor
---

Adds drag-and-drop states to the `Item` components:

- `Item`: `grabbable`, `dragging`, `dropIndicator` (`before` | `after`), `dropTarget` (`available` | `active`), `dropDisabled` and `dropped`.
- `ItemGroup`: `dragging`, `dropIndicator`, `dropTarget`, `dropDisabled` and `dropped`.
- `ItemDragHandle`, an optional trailing grip with a `disabled` state, and `ItemDropSlot`, the place to drop into an empty group.
- Classes a list draws while a row is dragged or moved by keyboard: drop line, drop box (active and available), drag preview, pointer shield and announcer. Drop lines and targets stay visible in forced colors, and the landing flash respects reduced motion.
