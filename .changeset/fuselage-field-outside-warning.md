---
'@rocket.chat/fuselage': patch
---

`FieldLabel`, `FieldRow`, `FieldError`, `FieldHint`, `FieldDescription`, `FieldLink` and `FieldLabelInfo` log an error instead of throwing when they are used outside a `Field` in development.
