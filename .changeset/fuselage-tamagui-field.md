---
'@rocket.chat/fuselage': minor
'@rocket.chat/meteor': patch
'@rocket.chat/ui-account': patch
---

Renders `Field`, its parts (`FieldLabel`, `FieldRow`, `FieldDescription`, `FieldHint`, `FieldError`, `FieldLink`) and `FieldGroup` with Tamagui frames compiled to static CSS. Their look is unchanged.

### Breaking for npm consumers

- Each part takes a neutral contract (`children`, `role`, `aria-label`, `aria-labelledby`, `aria-describedby`, `aria-hidden`, `aria-live`, `testID`, `ref`, `onPress`) plus, on the web, `id`, `className`, `title`, `data-*` and the pointer, keyboard and focus handlers. `FieldLink` also takes `href`, `target`, `rel` and `download`; `FieldGroup` takes `disabled`, `form` and `name`; `FieldHint` takes `dangerouslySetInnerHTML`. Any other HTML attribute no longer type-checks and is not forwarded.
- `onPress` is the press; `onClick` still works and is deprecated.
- `style` and the Box styling props are no longer accepted.
- The text parts state `white-space: inherit`, so a class that sets `white-space` on a description, hint, error or link no longer applies: set it on an element around the part.
- `FieldGroup` spaces its children with `gap` instead of a margin between adjacent `rcx-field-group__item` elements, so that class no longer spaces elements outside a `FieldGroup`.
- The text parts state their type scale in their frames (`p2` for the description, `c1` for the hint, error and link), so a class that sets `font-size`, `line-height`, `font-weight` or `letter-spacing` on one of them no longer applies.
