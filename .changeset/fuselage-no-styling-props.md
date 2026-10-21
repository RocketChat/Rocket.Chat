---
'@rocket.chat/fuselage': minor
'@rocket.chat/fuselage-ui-kit': patch
'@rocket.chat/layout': patch
'@rocket.chat/meteor': patch
'@rocket.chat/onboarding-ui': patch
'@rocket.chat/ui-client': patch
'@rocket.chat/ui-composer': patch
'@rocket.chat/ui-voip': patch
'@rocket.chat/ui-registration': patch
---

Fuselage components no longer take Box styling props from their callers: containers own layout through `gap`, and components declare the variations they support.

**fuselage**

- `Button` accepts `compact`, which lowers its minimum width so a label of one or two characters fits.
- `ButtonGroup` accepts `stretch='equal'`, which stretches its buttons and gives them all the same width.
- Square buttons, such as `IconButton`, keep their size inside a `ButtonGroup` with `stretch` instead of growing with the other buttons.
- The icon inside a `Button` takes its spacing from the Button styles instead of a styling prop.
- `CardGrid` accepts `CardGridItem` children with their own column spans and a `minRowHeight`, and skips empty children instead of rendering empty cells.
- `CardGrid` stretches each card to the height of its row, so cards no longer need `height='full'`.
- `Chip` accepts `label`, which renders its text in uppercase for chips that categorize rather than select.
- `Chip` accepts `small`, which renders a 20px tall chip.
- Inputs with an addon have the same minimum height as the other inputs.
- `AutoComplete` and `MultiSelect` space their input and selected items with a 4px gap instead of wrapping them in `Margins`, so a `renderSelected` item no longer needs to forward its class name or bring its own margin to be spaced.
- Button and IconButton render only as a button or a link: `is` accepts `'button'` or `'a'`.
- Button and IconButton rendered as links no longer carry `type="button"`, and IconButton accepts `external` to open its link in a new tab.
- `Chip` has a fixed 28px height, so chips holding an inline avatar no longer grow past it; `small` chips stay 20px.
- Date and time inputs match the other inputs' height
- Adds a `flush` prop to `Divider` that removes its own margin, so its container sets the spacing.
- Adds a `light` variation to `Divider`, drawn with the `stroke-light` color.
- A vertical `Divider` with `variation='danger'` is drawn in the error colour instead of the default grey.
- Adds `small` and `stretch` props to the vertical `Divider`: `small` uses a 4px inline margin, `stretch` makes it as tall as its container.
- Adds a `justify='end'` variation to `FieldRow` that packs the row's content at the end of the line.
- Declares `color` on `Icon`, `MenuItemIcon` and `MessageStatusIndicatorItem`, restricted to the semantic text and status font tokens.
- Icons no longer shrink in a flex container.
- Adds `endAddonFlush` to `InputBox` and the inputs built on it, so a button in `endAddon` sits flush with the input edge without negative margins
- Adds a `transparent` flag to `ModalBackdrop` that drops its overlay colour.
- Declares `width` and `height` on `ModalHeroImage`, the size the image renders at.
- Adds a `variant` (`danger`, `warning`, `info`, `success`) to `ModalIcon` that tints the icon, and a `subtle` flag to `ModalTagline` that mutes its colour.
- Declares `width` and `height` on `Modal`, makes its `hidden` attribute hide it while keeping it mounted, and adds a `fill` mode to `ModalContent` that stretches the content to the modal's height.
- Adds `PopoverSurface`, the raised and scrolling surface of a dropdown or popover, which takes `maxHeight`, `flush` and `elevation` instead of `Box` styling props.
- Adds the `inverted` variation to `Skeleton`, for placeholders on a dark surface such as a tooltip.
- Adds `Stack`, a flex container that lays out its children in a row or a column spaced by `gap`, without taking `Box` styling props.
- TableCell renders only as a data or header cell: `is` accepts `'td'` or `'th'`.
- `Tag` now spaces its `icon` from the label, so the icon no longer needs a margin of its own.
- Adds a `flush` flag to `Tile` that drops its default padding, for surfaces whose content brings its own.
- Adds `badgePosition` to `IconButton`, which pins the badge to the top end (default) or bottom end corner.
- Fixes the `IconButton` badge jumping toward the button's center while the button is pressed; it now keeps its corner and moves 1px with the icon.
- `IconButton` accepts `color`, `'default'` or `'danger'`, which paints the icon with that font color.
- A Divider with a label no longer adds 20px of inline padding, so its bars run from edge to edge of its container.
- `SelectLegacy`, `SelectFiltered`, `PaginatedSelectFiltered` and `PaginatedMultiSelectFiltered` put `id` on their focusable control, so clicking a `FieldLabel` whose `htmlFor` points to that `id` focuses the field.
- `SelectLegacy`, `SelectFiltered`, `PaginatedSelectFiltered` and `PaginatedMultiSelectFiltered` put `aria-labelledby`, `aria-describedby` and `aria-invalid` on their focusable control instead of the wrapper, so screen readers announce the field's label instead of its placeholder.
- `MessageGenericPreviewIcon` takes its icon colour from the preview's styles and no longer accepts a `color` prop.
- Fixes `Select` adding an extra gap before its trigger when placed directly inside a container that spaces its children with `gap`.
- `TableCell` accepts `rowHeader`, which renders the cell as the header of its row, styled as the label of a key/value pair.
- `Table` accepts `columns`, which declares the width of each column once instead of on every cell.
- `Tabs` accepts `stretch`, which grows its items to fill the whole width.

**fuselage-ui-kit**

- The `context` block spaces its elements with an 8px column gap instead of margins, so it no longer overhangs the surface edges and its images sit 8px from their neighbours.
- The `linear_scale` element spaces its buttons with the button group's gap alone, so they sit 8px apart instead of 12px.
- UiKit surfaces space their blocks with a 16px gap instead of per-block margins, so blocks sit 16px apart, divider and tabs no longer add their own 24px margins, and only the message surface keeps 16px of space after its last block.
- Colours UiKit icon elements with `danger`, `warning` and `secondary` variants through Fuselage's `Icon` `color`; `secondary` now uses the hint colour.

**layout**

- `Form` renders a form element that wraps its `Tile`, instead of rendering the `Tile` itself as the form.
- Narrows `ListItem`'s `iconColor` to a status (`hint`, `info`, `danger`, `warning` or `success`); without one the icon follows the item's text colour, as it already did.
- `VerticalWizardLayoutForm` sizes its `Tile` with a full-width wrapper instead of a `width` prop on `Tile`.

**meteor**

- When an app has no price, its status tags on the details page sit 8px closer to the Buy button.
- The author row of quote and message attachments spaces its avatar, name, timestamp and jump link 4px apart.
- Audited messages on the Message auditing page no longer inherit an extra vertical margin, so each one is 8px shorter.
- The contact details panel no longer draws a divider above the custom fields; they follow the other fields with the same spacing.
- The custom emoji upload button and the canned response preview toggle sit next to their label in a `FieldRow` instead of inside the label.
- Form labels in the thread composer, the workspace registration terms, the onboarding terms and the new-user password options use the default field label typography, and the close-chat modal note is shown as a field hint.
- Fixes the "Counters" header of the import history table so it also spans the "Total" column.
- Fixes the instances modal announcing each property name as a column header instead of a row header
- Colours the icons of the room priority menu like the priority icon shown in the room, by the priority's status.
- The room header leaves 4px instead of 8px after the encrypted and translated status icons.
- Fixes the user menu button so screen readers announce the user's current status and its changes.

**onboarding-ui**

- The cloud workspace form spaces its server region and language fields with padding around the grid instead of a margin on it, which adds 24 to 32px of height to the form.

**ui-client**

- Fixes the warning and success icons of `GenericModal` showing in the default text colour instead of their status colours.
- `HeaderTagIcon` no longer carries a trailing margin; pass it to `HeaderTag`'s `icon` prop, which spaces it from the text.
- Page header spaces its sidebar toggler and back button with gap; `SidebarToggler` no longer carries a trailing margin.
- `HeaderContentRow` spaces its items 4px apart, and `HeaderState` no longer adds its own trailing margin.
- The `MultiSelectCustom` list is drawn on Fuselage's `PopoverSurface`, so its corners are rounded like the other dropdowns.

**ui-composer**

- `MessageFooterCallout` spaces its children with an 8px gap instead of margins on `MessageComposerIcon`, `MessageFooterCalloutContent`, `MessageFooterCalloutDivider` and `MessageFooterCalloutAction`, so the action button now sits flush with the callout padding.

**ui-voip**

- Call history footer buttons lay out their icon and label with gap.
- The keypad keys take their size and corner radius from their own class instead of styling props on `Button`.
- Call widget info slots lay out their icon and text with gap.

**web-ui-registration**

- The desktop app's "Log in on the web" button sits in the same button group as the login services.
- The login services divider takes its spacing from a padded container.
- The login language switch buttons are spaced with an 8px gap instead of a trailing margin, so they are centred in the footer.
