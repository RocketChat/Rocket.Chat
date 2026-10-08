---
'@rocket.chat/fuselage-forms': patch
---

Fixed inputs rendered outside a `Field` overriding their own `id`, `aria-labelledby`, `aria-describedby` and `aria-invalid` with references to a label that doesn't exist, which left them without an accessible name. Outside a `Field`, the inputs now keep the props they were given.
