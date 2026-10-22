---
'@rocket.chat/fuselage': patch
---

Button and IconButton accept only `button` or `a` in `is`. As links they no longer carry `type="button"`, and IconButton gains `external` to open links in a new tab, as Button already does.
