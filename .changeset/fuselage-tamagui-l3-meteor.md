---
'@rocket.chat/meteor': patch
---

Moves the call sites of the L3 forms, list and select components off the `style` and input-only props they no longer take. Visible and class changes for anyone styling the client with custom CSS: the account profile form is 48px shorter because `FieldGroup` spaces its fields with `gap`; `rcx-field-group__item` is gone; rows that hold a link carry `rcx-item--interactive`; the Field description, hint, error and link carry `rcx-box--with-inline-elements`; and the select family keeps its `rcx-select` and `rcx-autocomplete` classes but its wrapper, field and values no longer use negative margins.
