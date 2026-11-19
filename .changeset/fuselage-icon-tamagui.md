---
'@rocket.chat/fuselage': minor
---

Renders `Icon` with Tamagui instead of `Box`. Its props are now a platform-neutral contract (`IconContract`: `name`, `size`, `color`, `role`, `aria-hidden`, `aria-label`, `aria-labelledby`, `aria-describedby`, `testID`, `ref`) plus what only the web takes.

**Breaking for npm consumers**

- `size` is a step of a closed scale: `x12`, `x15`, `x16`, `x18`, `x20`, `x22`, `x24`, `x28`, `x32`, `x36`, `x40`, `x48`, `x60`, `x64`, or the same step as a number (`24`). Any other value, such as `'60px'`, `'2rem'` or `x8`, is a type error and leaves the icon at the size of the text around it. `Chevron` takes the same scale.
- A size is a `size` token of the Tamagui config, in `rem` on the web. A named step (`x16`) follows the root font size as it did; a number (`24`) used to be a fixed number of pixels and now follows it too.
- On the web `Icon` takes only `id`, `className`, `title`, `data-*`, `ref`, `onClick`, `onKeyDown` and `onMouseEnter` besides its contract. It no longer accepts `style` or any other HTML attribute or handler; `FramedIcon` and `MessageStatusIndicatorItem` take the same props.
- `testID` is a new prop, rendered as `data-testid`.
- A `color` reads the theme key `--rcx-<token>` that `PaletteStyleTag` writes, with no built-in fallback: a page that renders no `PaletteStyleTag` gets the colour of the text around the icon.
- The `.rcx-icon` rule is gone from the stylesheet: the element keeps the classes `rcx-box rcx-box--full rcx-icon rcx-icon--name-<name>` and takes its look from generated classes.
- The published bundle now contains the Tamagui runtime.

A native consumer registers the font file `@rocket.chat/icons/dist/font/rocketchat.ttf` under the family `RocketChat`; without it every icon renders as a system emoji.
