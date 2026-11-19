---
'@rocket.chat/fuselage': minor
---

Renders `Label` and `LabelInfo` with Tamagui frames compiled to static CSS. Their look is unchanged.

### Breaking for npm consumers

- `Label` takes the neutral `LabelContract` (`children`, `disabled`, `required`, `role`, `aria-label`, `aria-labelledby`, `aria-describedby`, `aria-hidden`, `aria-live`, `testID`, `ref`, `onPress`) plus, on the web, `id`, `className`, `title`, `htmlFor`, `data-*`, `is` and the pointer, keyboard and focus handlers. Any other HTML attribute no longer type-checks and is not forwarded.
- `onPress` is the press; `onClick` still works and is deprecated.
- `is` is a closed set, `label`, `span` or `legend`; `legend` renders the legend of a fieldset. It took any element type before.
- `style` and the Box styling props (`marginInline`, `color`, `fontScale` and the like) are no longer accepted.
- The required mark and `LabelInfo` carry their own 4px inline spacing; it no longer comes from Box classes.
- The label states its type scale (`p2m`) in its frame, so a class that sets `font-size`, `line-height`, `font-weight` or `letter-spacing` on a `Label` no longer applies.
