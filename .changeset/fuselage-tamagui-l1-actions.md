---
'@rocket.chat/fuselage': minor
'@rocket.chat/ui-voip': patch
'@rocket.chat/meteor': patch
---

Renders the L1 action components with Tamagui frames compiled to static CSS: `Button`, `IconButton`, `ButtonGroup`, `SplitButton` and `SplitButtonTrigger`, `Chip`, `Badge`, `Chevron`, `Tag`, `CheckBox`, `RadioButton` and `ToggleSwitch`. Their look is unchanged, except that Tag no longer overflows the panel it sits in (the chat info tag list wraps, the long tag keeps its rounded corners) and the tags cell of the chats table shows a long tag truncated instead of clipped.

`SplitButton` now tells the `Button` and `IconButton` it holds their position and tone through a React context, and they paint the group's rounded corners and the trigger's ghost colours from variants instead of from the group's stylesheet. `ModalHeader` spaces its buttons with `gap`.

### Breaking for npm consumers

- `style` is no longer accepted by the migrated parts of these components, and no longer reaches their elements. Their props narrow to the attributes of the element they render, so an attribute outside that list no longer type-checks, and one passed anyway is not forwarded. This includes the native `input` of `CheckBox`, `RadioButton` and `ToggleSwitch`, which take the input attributes only.
- `Badge`: the `is` prop is removed; it always renders a `span`.
- `Chevron`: the `top` and `bottom` props, which did nothing, are removed, and `size` takes an icon size instead of a Box width.
- `IconButton`: `color` accepts `default` and `danger` and paints the glyph with a font token. A new `loading` prop swaps the icon for a spinner and disables the button, as `Button` does. The icon is rendered inside a content `span`, so a selector that reached the icon as a direct child of the button no longer matches.
- `Chip`: it no longer goes through `withBoxStyling`, so Box styling props stop reaching it; the margin `Margins` put on its children is now the chip's own padding and gap.
- `Button`: the stray `label` prop that was forwarded to the DOM is no longer accepted.
- `Tag`: the link variant's `:visited` colour is the tag's own, not the browser's.
- The published build registers the Tamagui configuration itself when it is loaded, so the components render without the consumer configuring Tamagui. Zero-runtime builds of the package do not include the registration.
