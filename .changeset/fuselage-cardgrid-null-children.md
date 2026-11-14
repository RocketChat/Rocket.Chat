---
'@rocket.chat/fuselage': patch
---

Fixed `CardGrid` rendering an empty, padded `GridItem` for `null`, `undefined` or boolean children, such as conditionally rendered cards.
