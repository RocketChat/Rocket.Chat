# Change Log

## 1.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies [5f3c7c2426a29a0f8237a1ec0d72192b2ef1f0a4]:</summary>
  - @rocket.chat/fuselage@1.0.0-rc.1
  - @rocket.chat/layout@1.0.0-rc.1

  </details>

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

- ([#43047](https://github.com/RocketChat/Rocket.Chat/pull/43047)) Moves spacing that was off the design system's scale to the nearest step (18px becomes 16px, 28px becomes 24px) in the vertical wizard title and the onboarding pages

- ([#42339](https://github.com/RocketChat/Rocket.Chat/pull/42339)) Moved `@rocket.chat/onboarding-ui` into the Rocket.Chat monorepo, continuing from the frozen Fuselage 0.37.3 release. The exported components and their declarations are unchanged.

- ([#43162](https://github.com/RocketChat/Rocket.Chat/pull/43162)) Fixes selects that screen readers announced without a name, such as the Threads, Team channels and timestamp picker selects, and the outgoing webhook event trigger, whose hint was never announced

- <details><summary>Updated dependencies [80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 7fbb5676fe0d2c034f4c52586ab858b3796e5dc6, 5c7b25f68d677d8bdbde3ed4c56ad0bba60ce71d, 5c7b25f68d677d8bdbde3ed4c56ad0bba60ce71d, 4c379a0d016fcf010bab86ddd94a22ff2401606e, 766ac93fba3c991c79c9bfcb404f6ec7fd1e30f8, 7fbb5676fe0d2c034f4c52586ab858b3796e5dc6, 4c379a0d016fcf010bab86ddd94a22ff2401606e, ad08045f56e3921e88ed021aa2945c9ba670e5f5, cea4d4428a0d86c6fc868542d4fb00a36ffaa27d, 7fbb5676fe0d2c034f4c52586ab858b3796e5dc6, 4c379a0d016fcf010bab86ddd94a22ff2401606e, 25fd477c2c38f71e9a16b7e2896d39efd43bfc61, 05e9b38a001919252360351f0bc3e46cc990a6ac, 25fd477c2c38f71e9a16b7e2896d39efd43bfc61, 2184b09b0bdacdb0bced60dc054a818a92c98131, e1b509fbca35eba10e21e4aa3bc15c56f44a2845, 0285f08c086dae6beb0f1365a85f522fb4818435, 6b86dffd3a05f65fff000bb697fbb40350664629, 5e6b6bd25ea82b9c884d49871870f71dc532a061, c0f8c0d2455b1a3352bd8c1fd442c125d939df77, 05e9b38a001919252360351f0bc3e46cc990a6ac, 909b2e6aa0a360075c5a91eb52b955824909423a, 909b2e6aa0a360075c5a91eb52b955824909423a, 909b2e6aa0a360075c5a91eb52b955824909423a, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, e1b509fbca35eba10e21e4aa3bc15c56f44a2845, 2d3331be63dde3449245963c33444dcb15fa8869, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, a838cc5af0652f59d0ab30aa1a488abded0622b1, 87667dcb84de0ce97f4ace88c900801254fa6535, 87667dcb84de0ce97f4ace88c900801254fa6535, 87667dcb84de0ce97f4ace88c900801254fa6535, 87667dcb84de0ce97f4ace88c900801254fa6535, 87667dcb84de0ce97f4ace88c900801254fa6535, cd88334c72f7f2310706abc4d481a2712019e373]:</summary>
  - @rocket.chat/fuselage@1.0.0-rc.0
  - @rocket.chat/fuselage-hooks@0.44.0-rc.0
  - @rocket.chat/layout@1.0.0-rc.0
  - @rocket.chat/icons@0.52.0-rc.0
  - @rocket.chat/logo@0.33.3-rc.0
  - @rocket.chat/styled@0.34.2-rc.0

  </details>

## 0.37.3

### Patch Changes

- [#2148](https://github.com/RocketChat/fuselage/pull/2148) [`0d8e038`](https://github.com/RocketChat/fuselage/commit/0d8e038801972ec29ad2fb1d26da088af05b7b23) Thanks [@tassoevan](https://github.com/tassoevan)! - feat(fuselage-tokens)!: Rework the token build and its output formats

## 0.37.2

### Patch Changes

- [#2096](https://github.com/RocketChat/fuselage/pull/2096) [`18b421e`](https://github.com/RocketChat/fuselage/commit/18b421ec571d72118fccf3f7705df45b17b16191) Thanks [@tassoevan](https://github.com/tassoevan)! - feat(fuselage): Drop styling props' aliases (`bg`, `w`, `h`, `m`, `mb`, `mbs`, `mbe`, `mi`, `mis`, `mie`, `p`, `pb`, `pbs`, `pbe`, `pi`, `pis`, `pie`) in favor of their full-name counterparts

## 0.37.1

### Patch Changes

- [#2060](https://github.com/RocketChat/fuselage/pull/2060) [`ee381bb`](https://github.com/RocketChat/fuselage/commit/ee381bb32982d0f4ed9ef26385b5016e0a2e4023) Thanks [@tassoevan](https://github.com/tassoevan)! - feat: Remove deprecations and keep documentation comments

## 0.37.0

### Minor Changes

- [#1999](https://github.com/RocketChat/fuselage/pull/1999) [`6e37f9d`](https://github.com/RocketChat/fuselage/commit/6e37f9d2fee4c9ebeb8ea2c1601bbd4c89905859) Thanks [@tassoevan](https://github.com/tassoevan)! - feat!: Upgrade to React 19

## 0.36.2

### Patch Changes

- [#1849](https://github.com/RocketChat/fuselage/pull/1849) [`99b319c`](https://github.com/RocketChat/fuselage/commit/99b319c6c2ef1015d1d1edb027068c23dc1e29d9) Thanks [@tassoevan](https://github.com/tassoevan)! - feat(storybook-dark-mode): Fork `storybook-dark-mode`

## 0.36.1

### Patch Changes

- [#1799](https://github.com/RocketChat/fuselage/pull/1799) [`3930b70`](https://github.com/RocketChat/fuselage/commit/3930b7008144a5c6966f0a228a7e07e223bcfc5a) Thanks [@tassoevan](https://github.com/tassoevan)! - feat(fuselage): Use non-polyfilled CSS custom properties

## 0.36.0

### Minor Changes

- [#1769](https://github.com/RocketChat/fuselage/pull/1769) [`e0b2dd1`](https://github.com/RocketChat/fuselage/commit/e0b2dd135e5a99c6638341c84a5ca60dfc4f413e) Thanks [@tassoevan](https://github.com/tassoevan)! - feat(fuselage): Remove deprecated `InputBox.*` component namespace

### Patch Changes

- [#1762](https://github.com/RocketChat/fuselage/pull/1762) [`cce8e7f`](https://github.com/RocketChat/fuselage/commit/cce8e7f7ae5bb261e95936c586ac831366579b7d) Thanks [@tassoevan](https://github.com/tassoevan)! - Deletes the `@rocket.chat/fuselage-polyfills` package

## 0.35.2

### Patch Changes

- [#1703](https://github.com/RocketChat/fuselage/pull/1703) [`33f6797`](https://github.com/RocketChat/fuselage/commit/33f67971392057420b3b3b49e35f567ac2af7319) Thanks [@aleksandernsilva](https://github.com/aleksandernsilva)! - fix(fuselage): FieldLabel required prop ignored when 'is' prop is set

## 0.35.1

### Patch Changes

- [#1599](https://github.com/RocketChat/fuselage/pull/1599) [`330f4e5`](https://github.com/RocketChat/fuselage/commit/330f4e585ba011b127e3b3600d581df886024208) Thanks [@yash-rajpal](https://github.com/yash-rajpal)! - Fixes a text alignment issue on server registration step

## 0.35.0

### Minor Changes

- [#1514](https://github.com/RocketChat/fuselage/pull/1514) [`c4d8300`](https://github.com/RocketChat/fuselage/commit/c4d8300a651a25b92450b8830c5028b4fcf8f4a1) Thanks [@tassoevan](https://github.com/tassoevan)! - feat: Raise minimum supported React version to 18

## 0.34.0

### Minor Changes

- [`971f07aae`](https://github.com/RocketChat/fuselage/commit/971f07aae4076481fd6b7d37c417d9b00972bc4a) Thanks [@dougfabris](https://github.com/dougfabris)! - feat(fuselage): Avoid `Box` usage on `ButtonGroup`

## 0.33.3

### Patch Changes

- [#1250](https://github.com/RocketChat/fuselage/pull/1250) [`7ccde2abc`](https://github.com/RocketChat/fuselage/commit/7ccde2abc3e177fea52357100b2ab63482b3d005) Thanks [@hugocostadev](https://github.com/hugocostadev)! - Replace country SelectFilter that uses the SelectLegacy component with the Select component in Setup Wizard Organization Page

## 0.33.2

### Patch Changes

- [#1227](https://github.com/RocketChat/fuselage/pull/1227) [`414b1fc88`](https://github.com/RocketChat/fuselage/commit/414b1fc88b1fc9d527d93e9fc1b3fa21d8c098e3) Thanks [@tiagoevanp](https://github.com/tiagoevanp)! - Fix offline registration wizard validation

## 0.33.1

### Patch Changes

- [#1208](https://github.com/RocketChat/fuselage/pull/1208) [`24a06471d`](https://github.com/RocketChat/fuselage/commit/24a06471d4fd3c48b4e9611b6d663218934d1416) Thanks [@tiagoevanp](https://github.com/tiagoevanp)! - Adjust some font scales and text colors, fix some wrong translations, remove description from admin email on register server step, disable register workspace button when air-gapped.

## 0.33.0

### Minor Changes

- [#1187](https://github.com/RocketChat/fuselage/pull/1187) [`088591304`](https://github.com/RocketChat/fuselage/commit/088591304de15a20f77e84335054e8469c21e2e8) Thanks [@juliajforesti](https://github.com/juliajforesti)! - feat(onboarding-ui): a11y forms improvements

- [#1185](https://github.com/RocketChat/fuselage/pull/1185) [`e092a3c7a`](https://github.com/RocketChat/fuselage/commit/e092a3c7a839b001ab646283174c2b99ff74997d) Thanks [@tiagoevanp](https://github.com/tiagoevanp)! - feat(onboarding-ui): Update agreements message on `RegisterServerForm`

- [#1182](https://github.com/RocketChat/fuselage/pull/1182) [`d5b269439`](https://github.com/RocketChat/fuselage/commit/d5b26943965d4d9a6d499968d933ead76a705ed3) Thanks [@tiagoevanp](https://github.com/tiagoevanp)! - feat(onboarding-ui): Required fields adjustments

- [#1184](https://github.com/RocketChat/fuselage/pull/1184) [`695d42a03`](https://github.com/RocketChat/fuselage/commit/695d42a03968c7477c0a5569ec2d6b6119407e5a) Thanks [@tiagoevanp](https://github.com/tiagoevanp)! - feat(onboarding-ui): Remove standalone and introduce offline server registration

- [#1183](https://github.com/RocketChat/fuselage/pull/1183) [`c3835a6a6`](https://github.com/RocketChat/fuselage/commit/c3835a6a6a48b8ba3a2e2b53950afe1c862bb709) Thanks [@tiagoevanp](https://github.com/tiagoevanp)! - feat(onboarding-ui): Modify AwaitingConfirmationPage page

## 0.32.1

### Patch Changes

- [`a97c7f086`](https://github.com/RocketChat/fuselage/commit/a97c7f08633e6e36a39c8933b530f9acacb83af0) Thanks [@dougfabris](https://github.com/dougfabris)! - chore: resolve-workspace-deps to publish pkg versions

## 0.32.0

### Minor Changes

- [`a04f9089d`](https://github.com/RocketChat/fuselage/commit/a04f9089d19ba32d2b2e80738d2d5f4dac0d3e0c) Thanks [@dougfabris](https://github.com/dougfabris)! - fix(onboarding-ui): Development warnings

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.31.0](https://github.com/RocketChat/fuselage/compare/v0.30.1...v0.31.0) (2021-12-28)

### Bug Fixes

- add mode on change in forms ([#592](https://github.com/RocketChat/fuselage/issues/592)) ([62ba8f1](https://github.com/RocketChat/fuselage/commit/62ba8f1ea4ec13cf5b89dba16b38cbf7ad7be864))
- docker image version ([8f181cf](https://github.com/RocketChat/fuselage/commit/8f181cf5a96084d7abd9ea94efd46cc50840c798))
- **onboarding-ui:** Remove manage workspace fallback ([#573](https://github.com/RocketChat/fuselage/issues/573)) ([7f0b870](https://github.com/RocketChat/fuselage/commit/7f0b870a268db5f7ca9030d134b1e78ea2fd2128))
- replace useAutoFocus ([34e406e](https://github.com/RocketChat/fuselage/commit/34e406e1a2cf2ee96aaf0b1b095d2a7d2a848baf))

### Features

- **onboarding-ui:** Add export to DarkModeProvider ([#561](https://github.com/RocketChat/fuselage/issues/561)) ([8e3f2ec](https://github.com/RocketChat/fuselage/commit/8e3f2ec136e55727b01adaa2bc90079903ef705b))
- **onboarding-ui:** add new background layer with new brand redesign ([#554](https://github.com/RocketChat/fuselage/issues/554)) ([6df6e74](https://github.com/RocketChat/fuselage/commit/6df6e74045183d59deee6db73ae19e59ae1a1482))
- **onboarding-ui:** add oauth auth page ([#586](https://github.com/RocketChat/fuselage/issues/586)) ([4a7ae0b](https://github.com/RocketChat/fuselage/commit/4a7ae0b7f0343425bb0134316b57682868d4b06f))
- **onboarding-ui:** add reset password flow ([#585](https://github.com/RocketChat/fuselage/issues/585)) ([7ca5dfe](https://github.com/RocketChat/fuselage/commit/7ca5dfef85805382be9a5f67847a8111446130de))
- **onboarding-ui:** Create new account page ([#575](https://github.com/RocketChat/fuselage/issues/575)) ([f443a11](https://github.com/RocketChat/fuselage/commit/f443a118156c4af3bfce57967097a5755a9c4ca5))
- New hooks for element size tracking ([#413](https://github.com/RocketChat/fuselage/issues/413)) ([8ca682c](https://github.com/RocketChat/fuselage/commit/8ca682c636d2e4813f7d346cb881513382be63cf))
- **onboarding-ui:** PasswordLess login flow ([#565](https://github.com/RocketChat/fuselage/issues/565)) ([19c3e08](https://github.com/RocketChat/fuselage/commit/19c3e089a37f4c89889d7012084f9593f86d33e4)), closes [#562](https://github.com/RocketChat/fuselage/issues/562)

# [0.30.0](https://github.com/RocketChat/fuselage/compare/v0.29.0...v0.30.0) (2021-10-06)

### Bug Fixes

- SelectFilter style ([1f7e745](https://github.com/RocketChat/fuselage/commit/1f7e745c238c2082783216a2c8725c9f418ae2cc))
- **fuselage:** Remove Field margin ([#543](https://github.com/RocketChat/fuselage/issues/543)) ([0cc10e1](https://github.com/RocketChat/fuselage/commit/0cc10e1b86bcf14a9ae590537a3d8e460b39b167))
- **jest:** Adjust jest and ts-jest dependencies ([#547](https://github.com/RocketChat/fuselage/issues/547)) ([91a4fa1](https://github.com/RocketChat/fuselage/commit/91a4fa1365394001afe1bd46480bda3bafed5505))

### Features

- **logo:** Rocket.Chat logo package ([#535](https://github.com/RocketChat/fuselage/issues/535)) ([94522e6](https://github.com/RocketChat/fuselage/commit/94522e6b74d02f88f56e9ac898ca26b9d1e42fbd))

# [0.29.0](https://github.com/RocketChat/fuselage/compare/v0.28.0...v0.29.0) (2021-08-31)

### Bug Fixes

- missing default values ([8d850a1](https://github.com/RocketChat/fuselage/commit/8d850a18f6f58ad77d984bf2ef0756ddd5576743))
- review ([bfc0b97](https://github.com/RocketChat/fuselage/commit/bfc0b97b2a43c6681383bba3f97202c53e8d6256))
- **onboarding-ui:** Export RequestTrialPage ([#522](https://github.com/RocketChat/fuselage/issues/522)) ([f9cbf3b](https://github.com/RocketChat/fuselage/commit/f9cbf3b369add738dac49c725f10dd486760926a))
- **onboarding-ui:** Labels wrapping under checkbox ([#509](https://github.com/RocketChat/fuselage/issues/509)) ([99b873e](https://github.com/RocketChat/fuselage/commit/99b873e794ad3451ed6d4860545a4c61a133ca2f))

### Features

- **onboarding-ui:** Check your email page ([#513](https://github.com/RocketChat/fuselage/issues/513)) ([50caee8](https://github.com/RocketChat/fuselage/commit/50caee84b3357beb0aebdd713eed2f0766ec910f))
- **onboarding-ui:** CloudOrganizationInfo Page ([#498](https://github.com/RocketChat/fuselage/issues/498)) ([4d04e66](https://github.com/RocketChat/fuselage/commit/4d04e66836d5dc57e8efb0ac222d03234733e4e3))
- **onboarding-ui:** Create Cloud Workspace Form ([#499](https://github.com/RocketChat/fuselage/issues/499)) ([afd88bf](https://github.com/RocketChat/fuselage/commit/afd88bf68c442e3fe487081b98622de392598df6))
- **onboarding-ui:** Magic Link Email Page ([#524](https://github.com/RocketChat/fuselage/issues/524)) ([a5b56af](https://github.com/RocketChat/fuselage/commit/a5b56af04299c604933451f2bf7bd6b9b828af45))
- **onboarding-ui:** Request trial form ([#505](https://github.com/RocketChat/fuselage/issues/505)) ([4c1bd35](https://github.com/RocketChat/fuselage/commit/4c1bd35324903badee9fec79e878ab045f7d5897))
- **onboarding-ui:** Request trial page ([#515](https://github.com/RocketChat/fuselage/issues/515)) ([bdbae4e](https://github.com/RocketChat/fuselage/commit/bdbae4e142aa8694a9400db873c1c417b7db1e82))

# [0.28.0](https://github.com/RocketChat/fuselage/compare/v0.27.0...v0.28.0) (2021-07-30)

### Bug Fixes

- Missing Sidebar type ([#506](https://github.com/RocketChat/fuselage/issues/506)) ([78f202d](https://github.com/RocketChat/fuselage/commit/78f202d5b84f1bc7fe638070ece020126dcdd686))

### Features

- **onboarding-ui:** AdminInfoPage for Cloud Registration wizard ([#497](https://github.com/RocketChat/fuselage/issues/497)) ([7557dce](https://github.com/RocketChat/fuselage/commit/7557dcea5c8afe6f658062125ab949d4ab27a45a))
- **onboarding-ui:** Administrator information form and Organization information form ([#489](https://github.com/RocketChat/fuselage/issues/489)) ([b289f68](https://github.com/RocketChat/fuselage/commit/b289f68676954b91c792d8d97680314178bf2c60))
- **onboarding-ui:** Common components ([#478](https://github.com/RocketChat/fuselage/issues/478)) ([d7511ab](https://github.com/RocketChat/fuselage/commit/d7511ab435bae8c35e02071832c9a615078a83d5))
- **onboarding-ui:** Invalid Link page ([#496](https://github.com/RocketChat/fuselage/issues/496)) ([6c74576](https://github.com/RocketChat/fuselage/commit/6c74576bb0e63e33771eb24bbd6f1c881088f44c))
- **onboarding-ui:** Self-hosted registration ([#501](https://github.com/RocketChat/fuselage/issues/501)) ([e47d579](https://github.com/RocketChat/fuselage/commit/e47d579938f1cb670e787b27402ece214e7d37e9))
- **onboarding-ui:** Server registration form ([#494](https://github.com/RocketChat/fuselage/issues/494)) ([be3185f](https://github.com/RocketChat/fuselage/commit/be3185ff8eba2b02cfda6736074ecc2f38ff1d3e))
- styled API; monorepo grooming ([#482](https://github.com/RocketChat/fuselage/issues/482)) ([1b6b70c](https://github.com/RocketChat/fuselage/commit/1b6b70cf67ec16927b1566adc2350295a8927223))

# [0.27.0](https://github.com/RocketChat/fuselage/compare/v0.26.0...v0.27.0) (2021-06-28)

### Features

- onboarding-ui package ([#463](https://github.com/RocketChat/fuselage/issues/463)) ([ea0a6c2](https://github.com/RocketChat/fuselage/commit/ea0a6c25ae1a719103dce742a18c54ab4f3d6442))
- Visibility toggle for PasswordInput ([#377](https://github.com/RocketChat/fuselage/issues/377)) ([5ef1bec](https://github.com/RocketChat/fuselage/commit/5ef1bec606e626704235cadfdb9bb7d424f8e481))

# [0.26.0](https://github.com/RocketChat/fuselage/compare/v0.25.0...v0.26.0) (2021-05-28)

**Note:** Version bump only for package @rocket.chat/string-helpers

# [0.25.0](https://github.com/RocketChat/fuselage/compare/v0.24.0...v0.25.0) (2021-05-19)

### Bug Fixes

- **fuselage:** fix duplicated values on paginated multi select ([#456](https://github.com/RocketChat/fuselage/issues/456)) ([4518a4e](https://github.com/RocketChat/fuselage/commit/4518a4e661cb525d957f6140d59a641a50fc7b20))
- **string-helpers:** Wrong typesVersions declaration ([256758c](https://github.com/RocketChat/fuselage/commit/256758c60ff8ed5ec7d86ff027ad3ea82f84aaf6))
- Location in typesVersions field ([#449](https://github.com/RocketChat/fuselage/issues/449)) ([491f98b](https://github.com/RocketChat/fuselage/commit/491f98b8cbc5e30f73adde377965f79fe565438b))

### Features

- [@rocket](https://github.com/rocket).chat/message-parser ([#443](https://github.com/RocketChat/fuselage/issues/443)) ([4722cdf](https://github.com/RocketChat/fuselage/commit/4722cdff46f5987f335d989be59649c7652bb12a))
- Peggy loader ([#450](https://github.com/RocketChat/fuselage/issues/450)) ([0496cad](https://github.com/RocketChat/fuselage/commit/0496cad457d76f8a4d6a217209e4a55e315e8365))

# [0.24.0](https://github.com/RocketChat/fuselage/compare/v0.23.0...v0.24.0) (2021-04-28)

### Features

- [@rocket](https://github.com/rocket).chat/string-helpers ([#431](https://github.com/RocketChat/fuselage/issues/431)) ([2509d6a](https://github.com/RocketChat/fuselage/commit/2509d6acdbe5ec8b216e8d4430373797c5f5dfe2))
