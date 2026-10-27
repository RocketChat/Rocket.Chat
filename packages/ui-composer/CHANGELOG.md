# @rocket.chat/ui-composer

## 7.0.0-rc.0

### Patch Changes

- ([#42974](https://github.com/RocketChat/Rocket.Chat/pull/42974)) Fuselage components no longer take Box styling props from their callers: containers own layout through `gap`, and components declare the variations they support.

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

- <details><summary>Updated dependencies [80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 7fbb5676fe0d2c034f4c52586ab858b3796e5dc6, 5c7b25f68d677d8bdbde3ed4c56ad0bba60ce71d, 5c7b25f68d677d8bdbde3ed4c56ad0bba60ce71d, 4c379a0d016fcf010bab86ddd94a22ff2401606e, ad08045f56e3921e88ed021aa2945c9ba670e5f5, cea4d4428a0d86c6fc868542d4fb00a36ffaa27d, 7fbb5676fe0d2c034f4c52586ab858b3796e5dc6, 4c379a0d016fcf010bab86ddd94a22ff2401606e, 25fd477c2c38f71e9a16b7e2896d39efd43bfc61, 05e9b38a001919252360351f0bc3e46cc990a6ac, 25fd477c2c38f71e9a16b7e2896d39efd43bfc61, 2184b09b0bdacdb0bced60dc054a818a92c98131, e1b509fbca35eba10e21e4aa3bc15c56f44a2845, 0285f08c086dae6beb0f1365a85f522fb4818435, 6b86dffd3a05f65fff000bb697fbb40350664629, 5e6b6bd25ea82b9c884d49871870f71dc532a061, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 588311c49bfce08e7106e7c0bb32741334fa5321, c637a035450ca2241bb04692f276921592e513f6, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, e1b509fbca35eba10e21e4aa3bc15c56f44a2845, c12e5836df7fc5a4c9ee7a760c6101cb0ee8474a, 2d3331be63dde3449245963c33444dcb15fa8869, f5e483d062fed3e13b07ffd200ba5f04a88a4370, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, a838cc5af0652f59d0ab30aa1a488abded0622b1, 52fdf8ea1b17b08482cf8cb21156f1be7b80844c, 5e7e4a8aa389be0d3d4ace0861c646069151674d, 87667dcb84de0ce97f4ace88c900801254fa6535, 87667dcb84de0ce97f4ace88c900801254fa6535, 87667dcb84de0ce97f4ace88c900801254fa6535, 87667dcb84de0ce97f4ace88c900801254fa6535, 87667dcb84de0ce97f4ace88c900801254fa6535, 05e9b38a001919252360351f0bc3e46cc990a6ac, 8fddbd4ebf2e4ac77a716b22a676077054506b7b, 5e7e4a8aa389be0d3d4ace0861c646069151674d, 5e7e4a8aa389be0d3d4ace0861c646069151674d]:</summary>
  - @rocket.chat/fuselage@1.0.0-rc.0
  - @rocket.chat/ui-client@36.0.0-rc.0
  - @rocket.chat/icons@0.52.0-rc.0

  </details>

## 6.0.0

### Minor Changes

- ([#41020](https://github.com/RocketChat/Rocket.Chat/pull/41020)) Adds a **Realtime Message Composer**, available as an opt-in **Feature Preview** (My Account → Feature Preview → Message → **Realtime message composer**). While the feature preview is off, the message composer keeps its current plain-text behavior.

### Patch Changes

- <details><summary>Updated dependencies [eeca122b913518d2231f9d9568a10873705845ee, 4be043d9356fd50d2e3e1b585008368f90e95505, 71cb69992cf9f6a85fff7278dbf5481b64b5c735, 6843a962e18a7c37986bc08e8a7cc9bbd8072b77, 37faaa89ad1b4b721d6054e40a91327bd8140525, e61b41d340e2722037de67551982fd70773d0617]:</summary>
  - @rocket.chat/ui-client@35.0.0

  </details>

## 6.0.0-rc.0

### Minor Changes

- ([#41020](https://github.com/RocketChat/Rocket.Chat/pull/41020)) Adds a **Realtime Message Composer**, available as an opt-in **Feature Preview** (My Account → Feature Preview → Message → **Realtime message composer**). While the feature preview is off, the message composer keeps its current plain-text behavior.

### Patch Changes

- <details><summary>Updated dependencies [eeca122b913518d2231f9d9568a10873705845ee, 4be043d9356fd50d2e3e1b585008368f90e95505, 71cb69992cf9f6a85fff7278dbf5481b64b5c735, 6843a962e18a7c37986bc08e8a7cc9bbd8072b77, 37faaa89ad1b4b721d6054e40a91327bd8140525, e61b41d340e2722037de67551982fd70773d0617]:</summary>
  - @rocket.chat/ui-client@35.0.0-rc.0

  </details>

## 5.0.0

### Patch Changes

- <details><summary>Updated dependencies [4947601bbf042cd1b2385f8f5dda438e608faea7, 742009a09148e33d141f50691cdec0f7e9818535]:</summary>
  - @rocket.chat/ui-client@34.0.0

  </details>

## 5.0.0-rc.0

### Patch Changes

- <details><summary>Updated dependencies [4947601bbf042cd1b2385f8f5dda438e608faea7, 742009a09148e33d141f50691cdec0f7e9818535]:</summary>
  - @rocket.chat/ui-client@34.0.0-rc.0

  </details>

## 4.0.0

### Patch Changes

- <details><summary>Updated dependencies [4b57346a59b5c9433c25845c886be11af1bf71d4]:</summary>
  - @rocket.chat/ui-client@33.0.0

  </details>

## 4.0.0-rc.0

### Patch Changes

- <details><summary>Updated dependencies [4b57346a59b5c9433c25845c886be11af1bf71d4]:</summary>
  - @rocket.chat/ui-client@33.0.0-rc.0

  </details>

## 3.0.0

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-client@32.0.0

  </details>

## 3.0.0-rc.0

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-client@32.0.0-rc.0

  </details>

## 2.0.0

### Patch Changes

- <details><summary>Updated dependencies [fac64728505b312d5da786e92d3134450ce4a7c1]:</summary>
  - @rocket.chat/ui-client@31.0.0

  </details>

## 2.0.0-rc.0

### Patch Changes

- <details><summary>Updated dependencies [fac64728505b312d5da786e92d3134450ce4a7c1]:</summary>
  - @rocket.chat/ui-client@31.0.0-rc.0

  </details>

## 1.0.0

### Minor Changes

- ([#40181](https://github.com/RocketChat/Rocket.Chat/pull/40181)) Adds file thumbnails with image preview to the message composer attachments

### Patch Changes

- <details><summary>Updated dependencies [543b6c8cbde0d084a3a923acf4845b68db80206a]:</summary>
  - @rocket.chat/ui-client@30.0.0

  </details>

## 1.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-client@30.0.0-rc.2

  </details>

## 1.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-client@30.0.0-rc.1

  </details>

## 1.0.0-rc.0

### Minor Changes

- ([#40181](https://github.com/RocketChat/Rocket.Chat/pull/40181)) Adds file thumbnails with image preview to the message composer attachments

### Patch Changes

- <details><summary>Updated dependencies [543b6c8cbde0d084a3a923acf4845b68db80206a]:</summary>
  - @rocket.chat/ui-client@30.0.0-rc.0

  </details>

## 0.6.0

### Minor Changes

- ([#39425](https://github.com/RocketChat/Rocket.Chat/pull/39425)) Adds support for multiple files in message composer, improving file upload experience

### Patch Changes

- ([#38989](https://github.com/RocketChat/Rocket.Chat/pull/38989)) chore(eslint): Upgrades ESLint and its configuration

## 0.6.0-rc.0

### Minor Changes

- ([#39425](https://github.com/RocketChat/Rocket.Chat/pull/39425)) Adds support for multiple files in message composer, improving file upload experience

### Patch Changes

- ([#38989](https://github.com/RocketChat/Rocket.Chat/pull/38989)) chore(eslint): Upgrades ESLint and its configuration

## 0.5.3

### Patch Changes

- ([#36207](https://github.com/RocketChat/Rocket.Chat/pull/36207)) Introduces the Outbound Message feature to Omnichannel, allowing organizations to initiate proactive communication with contacts through their preferred messaging channel directly from Rocket.Chat

## 0.5.3-rc.0

### Patch Changes

- ([#36207](https://github.com/RocketChat/Rocket.Chat/pull/36207)) Introduces the Outbound Message feature to Omnichannel, allowing organizations to initiate proactive communication with contacts through their preferred messaging channel directly from Rocket.Chat

## 0.5.2

### Patch Changes

- ([#35286](https://github.com/RocketChat/Rocket.Chat/pull/35286)) Bumps fuselage and related packages versions to use the most recent releases of each package, especially the fix for the missing track of the fuselage slider component

## 0.5.2-rc.0

### Patch Changes

- ([#35286](https://github.com/RocketChat/Rocket.Chat/pull/35286)) Bumps fuselage and related packages versions to use the most recent releases of each package, especially the fix for the missing track of the fuselage slider component

## 0.5.1

### Patch Changes

- ([#34858](https://github.com/RocketChat/Rocket.Chat/pull/34858)) Fixes an issue that prevented the apps-engine from reestablishing communications with subprocesses in some cases

## 0.5.1-rc.0

### Patch Changes

- ([#34858](https://github.com/RocketChat/Rocket.Chat/pull/34858)) Fixes an issue that prevented the apps-engine from reestablishing communications with subprocesses in some cases

## 0.5.0

### Minor Changes

- ([#34076](https://github.com/RocketChat/Rocket.Chat/pull/34076)) Introduces a new option when exporting messages, allowing users to select and download a JSON file directly from client

### Patch Changes

- ([#34205](https://github.com/RocketChat/Rocket.Chat/pull/34205)) Fixes an error where the engine would not retry a subprocess restart if the last attempt failed

- ([#34858](https://github.com/RocketChat/Rocket.Chat/pull/34858)) Fixes an issue that prevented the apps-engine from reestablishing communications with subprocesses in some cases

- ([#34205](https://github.com/RocketChat/Rocket.Chat/pull/34205)) Fixes error propagation when trying to get the status of apps in some cases

- ([#34205](https://github.com/RocketChat/Rocket.Chat/pull/34205)) Fixes wrong data being reported to total failed apps metrics and statistics

## 0.5.0-rc.1

### Patch Changes

- ([#34858](https://github.com/RocketChat/Rocket.Chat/pull/34858)) Fixes an issue that prevented the apps-engine from reestablishing communications with subprocesses in some cases

## 0.5.0-rc.0

### Minor Changes

- ([#34076](https://github.com/RocketChat/Rocket.Chat/pull/34076)) Introduces a new option when exporting messages, allowing users to select and download a JSON file directly from client

### Patch Changes

- ([#34205](https://github.com/RocketChat/Rocket.Chat/pull/34205)) Fixes an error where the engine would not retry a subprocess restart if the last attempt failed

- ([#34205](https://github.com/RocketChat/Rocket.Chat/pull/34205)) Fixes error propagation when trying to get the status of apps in some cases

- ([#34205](https://github.com/RocketChat/Rocket.Chat/pull/34205)) Fixes wrong data being reported to total failed apps metrics and statistics

## 0.4.0

### Minor Changes

- ([#33592](https://github.com/RocketChat/Rocket.Chat/pull/33592)) Adds ability to collapse/expand sidebar groups

- ([#33283](https://github.com/RocketChat/Rocket.Chat/pull/33283)) Adds a warning to inform users they are about to send unencrypted messages in an E2E Encrypted room if they have the `Unencrypted messages in encrypted rooms` setting enabled.

## 0.4.0-rc.0

### Minor Changes

- ([#33592](https://github.com/RocketChat/Rocket.Chat/pull/33592)) Adds ability to collapse/expand sidebar groups

- ([#33283](https://github.com/RocketChat/Rocket.Chat/pull/33283)) Adds a warning to inform users they are about to send unencrypted messages in an E2E Encrypted room if they have the `Unencrypted messages in encrypted rooms` setting enabled.

## 0.3.0

### Minor Changes

- ([#32821](https://github.com/RocketChat/Rocket.Chat/pull/32821)) Replaced new `SidebarV2` components under feature preview

## 0.3.0-rc.0

### Minor Changes

- ([#32821](https://github.com/RocketChat/Rocket.Chat/pull/32821)) Replaced new `SidebarV2` components under feature preview

## 0.2.1

### Patch Changes

- ([#32968](https://github.com/RocketChat/Rocket.Chat/pull/32968)) Bumped @rocket.chat/fuselage that fixes the Menu onPointerUp event behavior

## 0.2.1-rc.0

### Patch Changes

- ([#32968](https://github.com/RocketChat/Rocket.Chat/pull/32968)) Bumped @rocket.chat/fuselage that fixes the Menu onPointerUp event behavior

## 0.2.0

### Minor Changes

- ([#31821](https://github.com/RocketChat/Rocket.Chat/pull/31821)) New runtime for apps in the Apps-Engine based on the Deno platform

## 0.2.0-rc.0

### Minor Changes

- ([#31821](https://github.com/RocketChat/Rocket.Chat/pull/31821)) New runtime for apps in the Apps-Engine based on the Deno platform

## 0.1.0

### Minor Changes

- ([#31510](https://github.com/RocketChat/Rocket.Chat/pull/31510)) Composer keyboard navigability

  ![Kapture 2024-01-22 at 11 33 14](https://github.com/RocketChat/Rocket.Chat/assets/27704687/f116c1e6-4ec7-4175-a01b-fa98eade2416)

- ([#31347](https://github.com/RocketChat/Rocket.Chat/pull/31347) by [@Sayan4444](https://github.com/Sayan4444)) New feature to support cancel message editing message and hints for shortcuts.

### Patch Changes

- ([#31138](https://github.com/RocketChat/Rocket.Chat/pull/31138)) feat(uikit): Move `@rocket.chat/ui-kit` package to the main monorepo

## 0.1.0-rc.0

### Minor Changes

- 4c2771fd0c: Composer keyboard navigability

  ![Kapture 2024-01-22 at 11 33 14](https://github.com/RocketChat/Rocket.Chat/assets/27704687/f116c1e6-4ec7-4175-a01b-fa98eade2416)

- e1fa2b84fb: New feature to support cancel message editing message and hints for shortcuts.

### Patch Changes

- b223cbde14: feat(uikit): Move `@rocket.chat/ui-kit` package to the main monorepo
