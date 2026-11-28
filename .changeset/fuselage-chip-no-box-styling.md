---
'@rocket.chat/fuselage': minor
---

`Chip` spaces its thumb, label and dismiss symbol with its own padding and gap instead of `Margins`. Nothing changes visually.

### Breaking for npm consumers

- `Chip` no longer goes through `withBoxStyling`, so Box styling props (`margin`, `padding`, `width`, ...) no longer reach it.
