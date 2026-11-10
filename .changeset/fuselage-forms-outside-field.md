---
'@rocket.chat/fuselage-forms': patch
---

Fixed inputs rendered outside a `Field` discarding the accessibility props they were given. Their `id` and `aria-labelledby` pointed to a label that doesn't exist, which left them without an accessible name; `aria-describedby` was emptied; and `aria-invalid` was always `false`, hiding errors the caller had flagged. Outside a `Field`, the inputs now keep the props they were given.
