---
'@rocket.chat/mongo-adapter': patch
---

Fixes client-side sorting ignoring or reversing supported MongoDB sort directions (`'asc'`, `'ascending'`, `-1` in a field and direction pair), single field, single pair and `Map` sort specifications, and crashing when a sorted path runs through an empty array
