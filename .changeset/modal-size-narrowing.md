---
'@rocket.chat/fuselage': minor
---

Narrows `Modal` `width`, `height` and `maxHeight`, and `ModalHeroImage` `width` and `height`, to a Fuselage size (`x480`) or a number of pixels.

### Breaking for npm consumers

- `Modal` `width`, `height` and `maxHeight`, and `ModalHeroImage` `width` and `height`, no longer accept arbitrary Box size values such as percentages or `'full'`.
