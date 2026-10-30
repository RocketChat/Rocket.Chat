# @rocket.chat/layout

## 1.0.0-rc.0

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

- ([#42408](https://github.com/RocketChat/Rocket.Chat/pull/42408)) Moved `@rocket.chat/layout` into the Rocket.Chat monorepo, continuing from the frozen Fuselage 0.36.3 release. The exported layouts and components keep the same API; only the build, lint, test and Storybook wiring changed.

- ([#43047](https://github.com/RocketChat/Rocket.Chat/pull/43047)) Moves spacing that was off the design system's scale to the nearest step (18px becomes 16px, 28px becomes 24px) in the vertical wizard title and the onboarding pages

- <details><summary>Updated dependencies [80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 7fbb5676fe0d2c034f4c52586ab858b3796e5dc6, 5c7b25f68d677d8bdbde3ed4c56ad0bba60ce71d, 5c7b25f68d677d8bdbde3ed4c56ad0bba60ce71d, 4c379a0d016fcf010bab86ddd94a22ff2401606e, 766ac93fba3c991c79c9bfcb404f6ec7fd1e30f8, 7fbb5676fe0d2c034f4c52586ab858b3796e5dc6, 4c379a0d016fcf010bab86ddd94a22ff2401606e, ad08045f56e3921e88ed021aa2945c9ba670e5f5, cea4d4428a0d86c6fc868542d4fb00a36ffaa27d, 7fbb5676fe0d2c034f4c52586ab858b3796e5dc6, 4c379a0d016fcf010bab86ddd94a22ff2401606e, 25fd477c2c38f71e9a16b7e2896d39efd43bfc61, 05e9b38a001919252360351f0bc3e46cc990a6ac, 25fd477c2c38f71e9a16b7e2896d39efd43bfc61, 2184b09b0bdacdb0bced60dc054a818a92c98131, ec381cf4a88002601fd2b83b7eed734a2e8165b6, 25fd477c2c38f71e9a16b7e2896d39efd43bfc61, ec381cf4a88002601fd2b83b7eed734a2e8165b6, e1b509fbca35eba10e21e4aa3bc15c56f44a2845, 6b86dffd3a05f65fff000bb697fbb40350664629, 5e6b6bd25ea82b9c884d49871870f71dc532a061, 909b2e6aa0a360075c5a91eb52b955824909423a, 909b2e6aa0a360075c5a91eb52b955824909423a, 909b2e6aa0a360075c5a91eb52b955824909423a, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, e1b509fbca35eba10e21e4aa3bc15c56f44a2845, 2d3331be63dde3449245963c33444dcb15fa8869, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 87667dcb84de0ce97f4ace88c900801254fa6535, 87667dcb84de0ce97f4ace88c900801254fa6535, 87667dcb84de0ce97f4ace88c900801254fa6535, 87667dcb84de0ce97f4ace88c900801254fa6535, 87667dcb84de0ce97f4ace88c900801254fa6535, cd88334c72f7f2310706abc4d481a2712019e373]:</summary>
  - @rocket.chat/fuselage@1.0.0-rc.0
  - @rocket.chat/fuselage-hooks@0.44.0-rc.0
  - @rocket.chat/fuselage-tokens@0.36.0-rc.0
  - @rocket.chat/logo@0.33.3-rc.0
  - @rocket.chat/styled@0.34.2-rc.0

  </details>

## 0.36.3

### Patch Changes

- [#2183](https://github.com/RocketChat/fuselage/pull/2183) [`5d45a29`](https://github.com/RocketChat/fuselage/commit/5d45a299df0ba17fbf9bd660476fc1f001ea8583) Thanks [@tassoevan](https://github.com/tassoevan)! - fix(layout): Adapt `HorizontalWizardLayoutTitle` to viewports below the `md` breakpoint

## 0.36.2

### Patch Changes

- [#2148](https://github.com/RocketChat/fuselage/pull/2148) [`0d8e038`](https://github.com/RocketChat/fuselage/commit/0d8e038801972ec29ad2fb1d26da088af05b7b23) Thanks [@tassoevan](https://github.com/tassoevan)! - feat(fuselage-tokens)!: Rework the token build and its output formats

## 0.36.1

### Patch Changes

- [#2096](https://github.com/RocketChat/fuselage/pull/2096) [`18b421e`](https://github.com/RocketChat/fuselage/commit/18b421ec571d72118fccf3f7705df45b17b16191) Thanks [@tassoevan](https://github.com/tassoevan)! - feat(fuselage): Drop styling props' aliases (`bg`, `w`, `h`, `m`, `mb`, `mbs`, `mbe`, `mi`, `mis`, `mie`, `p`, `pb`, `pbs`, `pbe`, `pi`, `pis`, `pie`) in favor of their full-name counterparts

## 0.36.0

### Minor Changes

- [#2060](https://github.com/RocketChat/fuselage/pull/2060) [`ee381bb`](https://github.com/RocketChat/fuselage/commit/ee381bb32982d0f4ed9ef26385b5016e0a2e4023) Thanks [@tassoevan](https://github.com/tassoevan)! - feat: Remove deprecations and keep documentation comments

## 0.35.0

### Minor Changes

- [#1999](https://github.com/RocketChat/fuselage/pull/1999) [`6e37f9d`](https://github.com/RocketChat/fuselage/commit/6e37f9d2fee4c9ebeb8ea2c1601bbd4c89905859) Thanks [@tassoevan](https://github.com/tassoevan)! - feat!: Upgrade to React 19

## 0.34.3

### Patch Changes

- [#2010](https://github.com/RocketChat/fuselage/pull/2010) [`6a21baf`](https://github.com/RocketChat/fuselage/commit/6a21baf14375149f5c3d8cb0eb14eacc958c6d32) Thanks [@tassoevan](https://github.com/tassoevan)! - fix(layout): Color in `HorizontalWizardLayoutCaption` issues warning in runtime

## 0.34.2

### Patch Changes

- [#1849](https://github.com/RocketChat/fuselage/pull/1849) [`99b319c`](https://github.com/RocketChat/fuselage/commit/99b319c6c2ef1015d1d1edb027068c23dc1e29d9) Thanks [@tassoevan](https://github.com/tassoevan)! - feat(storybook-dark-mode): Fork `storybook-dark-mode`

## 0.34.1

### Patch Changes

- [#1799](https://github.com/RocketChat/fuselage/pull/1799) [`3930b70`](https://github.com/RocketChat/fuselage/commit/3930b7008144a5c6966f0a228a7e07e223bcfc5a) Thanks [@tassoevan](https://github.com/tassoevan)! - feat(fuselage): Use non-polyfilled CSS custom properties

## 0.34.0

### Minor Changes

- [#1769](https://github.com/RocketChat/fuselage/pull/1769) [`e0b2dd1`](https://github.com/RocketChat/fuselage/commit/e0b2dd135e5a99c6638341c84a5ca60dfc4f413e) Thanks [@tassoevan](https://github.com/tassoevan)! - feat(fuselage): Remove deprecated `InputBox.*` component namespace

### Patch Changes

- [#1762](https://github.com/RocketChat/fuselage/pull/1762) [`cce8e7f`](https://github.com/RocketChat/fuselage/commit/cce8e7f7ae5bb261e95936c586ac831366579b7d) Thanks [@tassoevan](https://github.com/tassoevan)! - Deletes the `@rocket.chat/fuselage-polyfills` package

## 0.33.1

### Patch Changes

- [#1703](https://github.com/RocketChat/fuselage/pull/1703) [`33f6797`](https://github.com/RocketChat/fuselage/commit/33f67971392057420b3b3b49e35f567ac2af7319) Thanks [@aleksandernsilva](https://github.com/aleksandernsilva)! - fix(fuselage): FieldLabel required prop ignored when 'is' prop is set

## 0.33.0

### Minor Changes

- [#1650](https://github.com/RocketChat/fuselage/pull/1650) [`69cae10`](https://github.com/RocketChat/fuselage/commit/69cae10093138e81a004a8229d14d214f60c509e) Thanks [@dougfabris](https://github.com/dougfabris)! - feat(layout): Remove unnecessary Link component

## 0.32.1

### Patch Changes

- [#1624](https://github.com/RocketChat/fuselage/pull/1624) [`c659931`](https://github.com/RocketChat/fuselage/commit/c65993112e87a9ed264886b35ffaef59b5ba2ceb) Thanks [@juliajforesti](https://github.com/juliajforesti)! - fix(layout): add missing tokens to layout `Form`

## 0.32.0

### Minor Changes

- [#1514](https://github.com/RocketChat/fuselage/pull/1514) [`c4d8300`](https://github.com/RocketChat/fuselage/commit/c4d8300a651a25b92450b8830c5028b4fcf8f4a1) Thanks [@tassoevan](https://github.com/tassoevan)! - feat: Raise minimum supported React version to 18

## 0.31.27

### Patch Changes

- [#1362](https://github.com/RocketChat/fuselage/pull/1362) [`2a4d8db74`](https://github.com/RocketChat/fuselage/commit/2a4d8db743fd2233bfe9f897ffe308955f56c24b) Thanks [@dougfabris](https://github.com/dougfabris)! - fix(layout): FormContainer wrong props

## 0.31.26

### Patch Changes

- [#1208](https://github.com/RocketChat/fuselage/pull/1208) [`24a06471d`](https://github.com/RocketChat/fuselage/commit/24a06471d4fd3c48b4e9611b6d663218934d1416) Thanks [@tiagoevanp](https://github.com/tiagoevanp)! - Adjust some font scales and text colors, fix some wrong translations, remove description from admin email on register server step, disable register workspace button when air-gapped.
