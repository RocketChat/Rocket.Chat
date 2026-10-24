---
'@rocket.chat/fuselage': patch
---

Fixes `EmailInput`, `NumberInput`, `PasswordInput`, `SearchInput`, `TextAreaInput`, `TextInput` and `UrlInput` rendering as a different input type when the props spread into them carry a `type`.
