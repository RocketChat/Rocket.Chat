---
'@rocket.chat/fuselage': patch
---

Fixes `AudioPlayerControls` elapsed time formatting at exactly one hour (`01:00:00` instead of `00:00`) and prevents duration wrapping past 24 hours.
