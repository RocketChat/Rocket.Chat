---
'@rocket.chat/fuselage': minor
---

`AnimatedVisibility` takes a single element as its child, since text and other content that can't play the animation never finish hiding and stay mounted.

Breaking for npm consumers: `children` is narrowed from `ReactNode` to `ReactElement`.
