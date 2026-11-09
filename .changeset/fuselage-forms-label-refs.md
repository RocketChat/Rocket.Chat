---
'@rocket.chat/fuselage-forms': patch
---

Fixed `HiddenLabel`, `LabelFor` and `ReferencedLabel` ignoring the `ref` passed by the caller. The ref now receives the rendered label element.
