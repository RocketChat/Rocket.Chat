---
'@rocket.chat/meteor': patch
---

Fixes sidebar keyboard navigation so tabbing forward from a room-group header (e.g. "Direct Messages") lands on the first room itself instead of skipping straight to its kebab menu, matching the behavior of every other room in the list.
