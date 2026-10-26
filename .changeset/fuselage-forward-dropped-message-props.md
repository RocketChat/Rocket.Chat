---
'@rocket.chat/fuselage': patch
---

Fixes `MessageGenericPreviewDescription`, `MessageGenericPreviewFooter`, `MessageGenericPreviewIcon`, `MessageStatusIndicatorText`, `MessageStatusPrivateIndicator`, `ThreadMessageOrigin` and `OptionHeader` dropping the HTML attributes and `className` they are given. `MessageGenericPreviewFooter` no longer declares the `clamp` prop, which it never used.
