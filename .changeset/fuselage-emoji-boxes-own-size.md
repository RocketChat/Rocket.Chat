---
'@rocket.chat/fuselage': minor
'@rocket.chat/meteor': patch
---

Message, thread and reaction emoji now size and align themselves (inline-flex, centered, `--emoji-size` sizing) instead of relying on the web client's `.emoji.emoji` override; the client rule is now a zero-specificity `:where(.emoji)`. In Storybook these emoji change from block/inline-block to inline-flex.
