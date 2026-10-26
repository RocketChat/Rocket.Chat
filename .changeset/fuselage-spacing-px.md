---
'@rocket.chat/fuselage': minor
'@rocket.chat/meteor': patch
---

Keeps margins, paddings and gaps the same size when the user changes the font size: spacing tokens (`'x8'`) and Fuselage's own component spacing now resolve to pixels, as numbers already did. Widths, heights and insets still follow the font size.
