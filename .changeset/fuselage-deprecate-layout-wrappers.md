---
'@rocket.chat/fuselage': minor
---

Deprecates `Margins`, `FlexContainer` and `FlexItem`. They only reach the first `Box` inside each child and do nothing on anything else. Space siblings with `gap` or `Stack`, and set flex item props on the element itself.
