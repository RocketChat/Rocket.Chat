---
'@rocket.chat/fuselage': minor
---

`AnimatedVisibility` now passes its animation class and `onAnimationEnd` handler to its direct children as props instead of through `BoxTransforms`, so a child that is not a `Box` receives them too.

Breaking for npm consumers: a direct child must accept `className` and `onAnimationEnd` and forward them to its DOM element; a child that relied on `AnimatedVisibility` reaching a nested `Box` through `BoxTransforms` no longer animates.
