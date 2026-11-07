---
'@rocket.chat/fuselage': major
---

Removes the message parts and props that nothing renders:

- `MessageStatusIndicatorText` and `ThreadMessageFollow`.
- `MessageSystemLeftContainer` and `ThreadMessageLeftContainer`, which were aliases of `MessageLeftContainer`; use `MessageLeftContainer`.
- The `variant` prop of `MessageStatusIndicatorItem` (use `color`) and of `MessageStatusPrivateIndicator`, with the `message-status-variant-color-*` theme variables.
- The `highlight` prop of `Message`, with its fade animation and the `message-background-color-highlight` theme variable.
- The `is` prop of `MessageHighlight`, which always renders a `span`.
- The `name` and `counter` props of `MessageReaction`; pass `MessageReactionEmoji` and `MessageReactionCounter` as children.
- The `3` and `4` values of `MessageBody`'s `clamp` prop; `clamp={2}` cuts the body at two lines.
