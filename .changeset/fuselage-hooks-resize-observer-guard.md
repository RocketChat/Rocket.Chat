---
'@rocket.chat/fuselage-hooks': patch
---

Fixes `useResizeObserver`, `useContentBoxSize`, `useBorderBoxSize` and `usePosition` throwing in runtimes without `ResizeObserver`, such as React Native. Where it does not exist they skip observing and return their initial sizes.
