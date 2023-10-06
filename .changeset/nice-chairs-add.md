---
"@rocket.chat/meteor": minor
"@rocket.chat/core-typings": minor
---

Added `push` statistic, containing three bits. Each bit represents a boolean:
```
1 1 1
| | |
| | +- push enabled = 0b1 = 1
| +--- push gateway enabled = 0b10 = 2
+----- push gateway changed = 0b100 = 4
```
