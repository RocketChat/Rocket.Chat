---
'@rocket.chat/fuselage-forms': patch
---

Fixed inputs getting an `id` made of two space-separated ids when their field registers a `placeholder` descriptor. The `id` now always matches the label's `htmlFor`, and the placeholder only joins `aria-labelledby`.
