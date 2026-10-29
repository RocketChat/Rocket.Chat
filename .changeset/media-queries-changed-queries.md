---
'@rocket.chat/fuselage-hooks': patch
---

Fixes `useMediaQueries` and `useMediaQuery` returning the results of the previous queries after the queries change, until the viewport changed again
