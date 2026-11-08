# @rocket.chat/web-ui-registration

## 36.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/layout@1.0.0-rc.1

  </details>

## 36.0.0-rc.0

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

- ([#42369](https://github.com/RocketChat/Rocket.Chat/pull/42369)) Removes the legacy Meteor OAuth login flow and the `Accounts_OAuth_Use_Modern_Flow` setting. OAuth logins (Apple, GitHub, GitLab, Google, Nextcloud and custom OAuth) now always use the server-side Passport flow, with PKCE/state validation.

  Also removes `Accounts_OAuth_Proxy_host` and `Accounts_OAuth_Proxy_services` settings and support for OAuth login through proxies.

- <details><summary>Updated dependencies [53bf8feb0c2075ee243d90c42ca2934098b93709, cea4d4428a0d86c6fc868542d4fb00a36ffaa27d, c0f8c0d2455b1a3352bd8c1fd442c125d939df77, 05e9b38a001919252360351f0bc3e46cc990a6ac, a9b2bb76d88e4d2743e0817b15e6447e7c9c46eb, daa677895dad92d6aab1e84a09f190efd2755ef9, 01204df7088b1362f14438d99c44bc4f6d6e840e, 982270a515cc061aafccb82a0605a36ce929d56c]:</summary>
  - @rocket.chat/ui-contexts@36.0.0-rc.0
  - @rocket.chat/layout@1.0.0-rc.0
  - @rocket.chat/tools@0.5.0-rc.0

  </details>

## 35.0.0

### Patch Changes

- ([#41127](https://github.com/RocketChat/Rocket.Chat/pull/41127)) Improves the mobile web experience: the page background now follows the active theme so Safari no longer shows white strips in the overscroll/safe-area regions (and tints its toolbar) in dark mode; the login "Welcome to <workspace>" title is scaled down on small screens; focusing a field no longer triggers iOS Safari's auto zoom-in (inputs use a 16px minimum on mobile); the login email/username field no longer auto-capitalizes/auto-corrects; and the connection status bar layout no longer truncates its "Connect" button on narrow screens.

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@35.0.0

  </details>

## 35.0.0-rc.0

### Patch Changes

- ([#41127](https://github.com/RocketChat/Rocket.Chat/pull/41127)) Improves the mobile web experience: the page background now follows the active theme so Safari no longer shows white strips in the overscroll/safe-area regions (and tints its toolbar) in dark mode; the login "Welcome to <workspace>" title is scaled down on small screens; focusing a field no longer triggers iOS Safari's auto zoom-in (inputs use a 16px minimum on mobile); the login email/username field no longer auto-capitalizes/auto-corrects; and the connection status bar layout no longer truncates its "Connect" button on narrow screens.

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@35.0.0-rc.0

  </details>

## 34.0.0

### Patch Changes

- <details><summary>Updated dependencies [742009a09148e33d141f50691cdec0f7e9818535]:</summary>
  - @rocket.chat/tools@0.4.0
  - @rocket.chat/ui-contexts@34.0.0

  </details>

## 34.0.0-rc.0

### Patch Changes

- <details><summary>Updated dependencies [742009a09148e33d141f50691cdec0f7e9818535]:</summary>
  - @rocket.chat/tools@0.4.0-rc.0
  - @rocket.chat/ui-contexts@34.0.0-rc.0

  </details>

## 33.0.0

### Minor Changes

- ([#40721](https://github.com/RocketChat/Rocket.Chat/pull/40721)) ## Phishing-Resistant Multi-Factor Authentication

  Introduces a more secure and reliable server-side OAuth authentication flow.

  ### What’s New
  - **Improved OAuth login security**
    OAuth authentication now happens fully on the server, reducing the risk of token theft, phishing attacks, and client-side credential interception.
  - **Built-in CSRF, state validation, and PKCE protection**
    OAuth logins now include stronger protection against CSRF attacks, request tampering, and authorization code interception through secure state validation and PKCE support.
  - **Improved two-step verification with OAuth logins**
    Users with email or TOTP two-factor authentication enabled will now be asked to complete 2FA even when signing in with providers like Google, GitHub, GitLab, and others.
  - **Improved mobile & desktop app login**
    Mobile and desktop apps now support a smoother and more secure deep-link OAuth login flow.
  - **A new setting to enable/disable new OAuth Flow**
    Enable this new setting `Accounts_OAuth_Use_Modern_Flow` to use all of the above mentioned features.

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@33.0.0

  </details>

## 33.0.0-rc.0

### Minor Changes

- ([#40721](https://github.com/RocketChat/Rocket.Chat/pull/40721)) ## Phishing-Resistant Multi-Factor Authentication

  Introduces a more secure and reliable server-side OAuth authentication flow.

  ### What’s New
  - **Improved OAuth login security**
    OAuth authentication now happens fully on the server, reducing the risk of token theft, phishing attacks, and client-side credential interception.
  - **Built-in CSRF, state validation, and PKCE protection**
    OAuth logins now include stronger protection against CSRF attacks, request tampering, and authorization code interception through secure state validation and PKCE support.
  - **Improved two-step verification with OAuth logins**
    Users with email or TOTP two-factor authentication enabled will now be asked to complete 2FA even when signing in with providers like Google, GitHub, GitLab, and others.
  - **Improved mobile & desktop app login**
    Mobile and desktop apps now support a smoother and more secure deep-link OAuth login flow.
  - **A new setting to enable/disable new OAuth Flow**
    Enable this new setting `Accounts_OAuth_Use_Modern_Flow` to use all of the above mentioned features.

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@33.0.0-rc.0

  </details>

## 32.0.0

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@32.0.0

  </details>

## 32.0.0-rc.0

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@32.0.0-rc.0

  </details>

## 31.0.0

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@31.0.0

  </details>

## 31.0.0-rc.0

### Minor Changes

- ([#39760](https://github.com/RocketChat/Rocket.Chat/pull/39760)) ## Phishing-Resistant Multi-Factor Authentication

  Introduces a more secure and reliable server-side OAuth authentication flow.

  ### What’s New
  - **Improved OAuth login security**
    OAuth authentication now happens fully on the server, reducing the risk of token theft, phishing attacks, and client-side credential interception.
  - **Built-in CSRF, state validation, and PKCE protection**
    OAuth logins now include stronger protection against CSRF attacks, request tampering, and authorization code interception through secure state validation and PKCE support.
  - **Improved two-step verification with OAuth logins**
    Users with email or TOTP two-factor authentication enabled will now be asked to complete 2FA even when signing in with providers like Google, GitHub, GitLab, and others.
  - **Improved mobile & desktop app login**
    Mobile and desktop apps now support a smoother and more secure deep-link OAuth login flow.

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@31.0.0-rc.0

  </details>

## 30.0.0

### Patch Changes

- <details><summary>Updated dependencies [95a82f72dd45fc51d54bb1beed295315facf9109]:</summary>
  - @rocket.chat/tools@0.3.0
  - @rocket.chat/ui-contexts@30.0.0

  </details>

## 30.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@30.0.0-rc.2

  </details>

## 30.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@30.0.0-rc.1

  </details>

## 29.0.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@29.0.2

  </details>

## 29.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@29.0.1

  </details>

## 30.0.0-rc.0

### Patch Changes

- <details><summary>Updated dependencies [95a82f72dd45fc51d54bb1beed295315facf9109]:</summary>
  - @rocket.chat/tools@0.3.0-rc.0
  - @rocket.chat/ui-contexts@30.0.0-rc.0

  </details>

## 29.0.0

### Patch Changes

- ([#38989](https://github.com/RocketChat/Rocket.Chat/pull/38989)) chore(eslint): Upgrades ESLint and its configuration

- ([#38955](https://github.com/RocketChat/Rocket.Chat/pull/38955) by [@mossae](https://github.com/mossae)) Fixes invalid email domain error not being displayed on the registration form.

- <details><summary>Updated dependencies [539659af22bc19880eda047dfc0b152472ccb65c, 43d0cfc6a70e8a31d5f3d24162216dae6b07efdd]:</summary>
  - @rocket.chat/ui-contexts@29.0.0
  - @rocket.chat/tools@0.2.5

  </details>

## 29.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@29.0.0-rc.4

  </details>

## 29.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@29.0.0-rc.3

  </details>

## 29.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@29.0.0-rc.2

  </details>

## 29.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@29.0.0-rc.1

  </details>

## 29.0.0-rc.0

### Patch Changes

- ([#38989](https://github.com/RocketChat/Rocket.Chat/pull/38989)) chore(eslint): Upgrades ESLint and its configuration

- ([#38955](https://github.com/RocketChat/Rocket.Chat/pull/38955) by [@mossae](https://github.com/mossae)) Fixes invalid email domain error not being displayed on the registration form.

- <details><summary>Updated dependencies [539659af22bc19880eda047dfc0b152472ccb65c, 43d0cfc6a70e8a31d5f3d24162216dae6b07efdd]:</summary>
  - @rocket.chat/ui-contexts@29.0.0-rc.0
  - @rocket.chat/tools@0.2.5-rc.0

  </details>

## 28.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@28.0.1

  </details>

## 28.0.0

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@28.0.0

  </details>

## 28.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@28.0.0-rc.2

  </details>

## 28.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@28.0.0-rc.1

  </details>

## 28.0.0-rc.0

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@28.0.0-rc.0

  </details>

## 27.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@27.0.1

  </details>

## 27.0.0

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@27.0.0

  </details>

## 27.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@27.0.0-rc.2

  </details>

## 27.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@27.0.0-rc.1
  </details>

## 27.0.0-rc.0

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@27.0.0-rc.0

  </details>

## 26.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
- @rocket.chat/ui-contexts@26.0.1

</details>

## 26.0.0

### Major Changes

- ([#36829](https://github.com/RocketChat/Rocket.Chat/pull/36829)) Removes the deprecated sendConfirmationEmail method

### Patch Changes

- <details><summary>Updated dependencies [ac11ea05ffadeca978c794ff38d5199d9acb2c29, 9e03ed5c5ea829c62c2da2de9413a27a4696f8a3]:</summary>
  - @rocket.chat/ui-contexts@26.0.0
  - @rocket.chat/tools@0.2.4

  </details>

## 26.0.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@26.0.0-rc.5

  </details>

## 26.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@26.0.0-rc.4

  </details>

## 26.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@26.0.0-rc.3

  </details>

## 26.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@26.0.0-rc.2

  </details>

## 26.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@26.0.0-rc.1

  </details>

## 26.0.0-rc.0

### Major Changes

- ([#36829](https://github.com/RocketChat/Rocket.Chat/pull/36829)) Removes the deprecated sendConfirmationEmail method

### Patch Changes

- <details><summary>Updated dependencies [ac11ea05ffadeca978c794ff38d5199d9acb2c29, 9e03ed5c5ea829c62c2da2de9413a27a4696f8a3]:</summary>
  - @rocket.chat/ui-contexts@26.0.0-rc.0
  - @rocket.chat/tools@0.2.4-rc.0

  </details>

## 25.0.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@25.0.2

  </details>

## 25.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@25.0.1

  </details>

## 25.0.0

### Patch Changes

- <details><summary>Updated dependencies [31ab78f0d4648b2ba99513ffce737d52ee34fe7f, 99255057f27b9d854a89da815681a03d0776f846]:</summary>
  - @rocket.chat/ui-contexts@25.0.0

  </details>

## 25.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@25.0.0-rc.2

  </details>

## 25.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@25.0.0-rc.1
  </details>

## 25.0.0-rc.0

### Patch Changes

- <details><summary>Updated dependencies [31ab78f0d4648b2ba99513ffce737d52ee34fe7f, 99255057f27b9d854a89da815681a03d0776f846]:</summary>
  - @rocket.chat/ui-contexts@25.0.0-rc.0

  </details>

## 24.0.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@24.0.2
  </details>

## 24.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@24.0.1

  </details>

## 24.0.0

### Patch Changes

- <details><summary>Updated dependencies [a25e88c06cafdbe3baf7a40e3bffe3aed5a81cf6]:</summary>
  - @rocket.chat/ui-contexts@24.0.0

  </details>

## 24.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@24.0.0-rc.4

  </details>

## 24.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@24.0.0-rc.3

  </details>

## 24.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@24.0.0-rc.2

  </details>

## 24.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@24.0.0-rc.1

  </details>

## 24.0.0-rc.0

### Patch Changes

- <details><summary>Updated dependencies [a25e88c06cafdbe3baf7a40e3bffe3aed5a81cf6]:</summary>
  - @rocket.chat/ui-contexts@24.0.0-rc.0

  </details>

## 23.0.0

### Patch Changes

- ([#36207](https://github.com/RocketChat/Rocket.Chat/pull/36207)) Introduces the Outbound Message feature to Omnichannel, allowing organizations to initiate proactive communication with contacts through their preferred messaging channel directly from Rocket.Chat

- <details><summary>Updated dependencies [feba290fc403de27efb6bb9a571bec43413e976a, c6ef437d9071dbd8c08152984dc39542b1ae7306]:</summary>
  - @rocket.chat/ui-contexts@23.0.0

  </details>

## 23.0.0-rc.7

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@23.0.0-rc.7

  </details>

## 23.0.0-rc.6

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@23.0.0-rc.6

  </details>

## 23.0.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@23.0.0-rc.5

  </details>

## 23.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@23.0.0-rc.4

  </details>

## 23.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@23.0.0-rc.3

  </details>

## 23.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@23.0.0-rc.2
  </details>

## 23.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@23.0.0-rc.1

  </details>

## 23.0.0-rc.0

### Patch Changes

- ([#36207](https://github.com/RocketChat/Rocket.Chat/pull/36207)) Introduces the Outbound Message feature to Omnichannel, allowing organizations to initiate proactive communication with contacts through their preferred messaging channel directly from Rocket.Chat

- <details><summary>Updated dependencies [feba290fc403de27efb6bb9a571bec43413e976a, c6ef437d9071dbd8c08152984dc39542b1ae7306]:</summary>
  - @rocket.chat/ui-contexts@23.0.0-rc.0

  </details>

## 22.0.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@22.0.2

  </details>

## 22.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
- @rocket.chat/ui-contexts@22.0.1

</details>

## 22.0.0

### Patch Changes

- <details><summary>Updated dependencies [c7db598e9f3c2ad47f6a6be2a9ba7078533c245b]:</summary>
  - @rocket.chat/ui-contexts@22.0.0

  </details>

## 22.0.0-rc.6

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@22.0.0-rc.6

  </details>

## 22.0.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@22.0.0-rc.5
  </details>

## 22.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@22.0.0-rc.4
  </details>

## 22.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@22.0.0-rc.3

  </details>

## 22.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@22.0.0-rc.2

  </details>

## 22.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@22.0.0-rc.1

  </details>

## 22.0.0-rc.0

### Patch Changes

- <details><summary>Updated dependencies [c7db598e9f3c2ad47f6a6be2a9ba7078533c245b]:</summary>
  - @rocket.chat/ui-contexts@22.0.0-rc.0

  </details>

## 21.0.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@21.0.3
  </details>

## 21.0.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@21.0.2

  </details>

## 21.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
- @rocket.chat/ui-contexts@21.0.1

</details>

## 21.0.0

### Patch Changes

- ([#35277](https://github.com/RocketChat/Rocket.Chat/pull/35277) by [@Anxhul10](https://github.com/Anxhul10)) Fixes email validation in the registration form to prevent users from registering with an already existing email address.

- <details><summary>Updated dependencies [fd478a7d45a4505ad53d2d7aec8b44e9bf8fa41a]:</summary>
  - @rocket.chat/tools@0.2.3
  - @rocket.chat/ui-contexts@21.0.0

  </details>

## 21.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@21.0.0-rc.2

  </details>

## 21.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@21.0.0-rc.1

  </details>

## 21.0.0-rc.0

### Patch Changes

- ([#35277](https://github.com/RocketChat/Rocket.Chat/pull/35277) by [@Anxhul10](https://github.com/Anxhul10)) Fixes email validation in the registration form to prevent users from registering with an already existing email address.

- <details><summary>Updated dependencies [fd478a7d45a4505ad53d2d7aec8b44e9bf8fa41a]:</summary>
  - @rocket.chat/tools@0.2.3-rc.0
  - @rocket.chat/ui-contexts@21.0.0-rc.0

  </details>

## 20.0.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@20.0.3

  </details>

## 20.0.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@20.0.2

  </details>

## 20.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@20.0.1

  </details>

## 20.0.0

### Patch Changes

- ([#36062](https://github.com/RocketChat/Rocket.Chat/pull/36062)) Removes the `Change to Default` language button from the login page

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@20.0.0

  </details>

## 20.0.0-rc.9

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@20.0.0-rc.9

  </details>

## 20.0.0-rc.8

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@20.0.0-rc.8

  </details>

## 20.0.0-rc.7

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@20.0.0-rc.7

  </details>

## 20.0.0-rc.6

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@20.0.0-rc.6

  </details>

## 20.0.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@20.0.0-rc.5

  </details>

## 20.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@20.0.0-rc.4

  </details>

## 20.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@20.0.0-rc.3

  </details>

## 20.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@20.0.0-rc.2

  </details>

## 20.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@20.0.0-rc.1
  </details>

## 20.0.0-rc.0

### Patch Changes

- ([#36062](https://github.com/RocketChat/Rocket.Chat/pull/36062)) Removes the `Change to Default` language button from the login page

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@20.0.0-rc.0

  </details>

## 19.0.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@19.0.4
  </details>

## 19.0.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@19.0.3

  </details>

## 19.0.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@19.0.2
    </details>

## 19.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@19.0.1

  </details>

## 19.0.0

### Patch Changes

- ([#35885](https://github.com/RocketChat/Rocket.Chat/pull/35885)) Fixes registration pages a11y color contrast and apply browser theme configuration

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@19.0.0

  </details>

## 19.0.0-rc.6

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@19.0.0-rc.6

  </details>

## 19.0.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@19.0.0-rc.5

  </details>

## 19.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@19.0.0-rc.4

  </details>

## 19.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@19.0.0-rc.3

  </details>

## 19.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@19.0.0-rc.2
  </details>

## 19.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@19.0.0-rc.1

  </details>

## 19.0.0-rc.0

### Patch Changes

- ([#35885](https://github.com/RocketChat/Rocket.Chat/pull/35885)) Fixes registration pages a11y color contrast and apply browser theme configuration

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@19.0.0-rc.0

  </details>

## 18.0.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@18.0.2

  </details>

## 18.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
- @rocket.chat/ui-contexts@18.0.1

</details>

## 18.0.0

### Patch Changes

- <details><summary>Updated dependencies [1eeb139158fcd621a2b8d3a7de5bb512e659261d, d8eb824d242cbbeafb11b1c4a806860e4541ba79, 4690c55d8e379d0bd5dfa444f3e0a4175e88d8de]:</summary>
  - @rocket.chat/ui-contexts@18.0.0

  </details>

## 18.0.0-rc.8

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@18.0.0-rc.8

  </details>

## 18.0.0-rc.7

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@18.0.0-rc.7

  </details>

## 18.0.0-rc.6

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@18.0.0-rc.6

  </details>

## 18.0.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@18.0.0-rc.5

  </details>

## 18.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@18.0.0-rc.4

  </details>

## 18.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@18.0.0-rc.3

  </details>

## 18.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@18.0.0-rc.2

  </details>

## 18.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@18.0.0-rc.1

  </details>

## 18.0.0-rc.0

### Patch Changes

- <details><summary>Updated dependencies [1eeb139158fcd621a2b8d3a7de5bb512e659261d, d8eb824d242cbbeafb11b1c4a806860e4541ba79, 4690c55d8e379d0bd5dfa444f3e0a4175e88d8de]:</summary>
  - @rocket.chat/ui-contexts@18.0.0-rc.0

  </details>

## 17.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@17.0.1

  </details>

## 17.0.0

### Patch Changes

- ([#35286](https://github.com/RocketChat/Rocket.Chat/pull/35286)) Bumps fuselage and related packages versions to use the most recent releases of each package, especially the fix for the missing track of the fuselage slider component

- <details><summary>Updated dependencies [c7b21f1c1e479533a208771f3e15f064f2c7e3ff]:</summary>
  - @rocket.chat/ui-contexts@17.0.0

  </details>

## 17.0.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@17.0.0-rc.5

  </details>

## 17.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@17.0.0-rc.4

  </details>

## 17.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@17.0.0-rc.3

  </details>

## 17.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@17.0.0-rc.2

  </details>

## 17.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@17.0.0-rc.1

  </details>

## 17.0.0-rc.0

### Patch Changes

- ([#35286](https://github.com/RocketChat/Rocket.Chat/pull/35286)) Bumps fuselage and related packages versions to use the most recent releases of each package, especially the fix for the missing track of the fuselage slider component

- <details><summary>Updated dependencies [c7b21f1c1e479533a208771f3e15f064f2c7e3ff]:</summary>
  - @rocket.chat/ui-contexts@17.0.0-rc.0

  </details>

## 16.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@16.0.1

  </details>

## 16.0.0

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@16.0.0

  </details>

## 16.0.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@16.0.0-rc.5

  </details>

## 16.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@16.0.0-rc.4

  </details>

## 16.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@16.0.0-rc.3
  </details>

## 16.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@16.0.0-rc.2

  </details>

## 16.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@16.0.0-rc.1

  </details>

## 16.0.0-rc.0

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@16.0.0-rc.0

  </details>

## 15.0.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@15.0.3

  </details>

## 15.0.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@15.0.2

  </details>

## 15.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@15.0.1

  </details>

## 15.0.0

### Patch Changes

- <details><summary>Updated dependencies [5506c406f4a22145ece065ad2b797225e94423ca]:</summary>
  - @rocket.chat/ui-contexts@15.0.0

  </details>

## 15.0.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@15.0.0-rc.5

  </details>

## 15.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@15.0.0-rc.4

  </details>

## 15.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@15.0.0-rc.3

  </details>

## 15.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@15.0.0-rc.2

  </details>

## 15.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@15.0.0-rc.1

  </details>

## 15.0.0-rc.0

### Patch Changes

- <details><summary>Updated dependencies [5506c406f4a22145ece065ad2b797225e94423ca]:</summary>
  - @rocket.chat/ui-contexts@15.0.0-rc.0

  </details>

## 14.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@14.0.1

  </details>

## 14.0.0

### Patch Changes

- <details><summary>Updated dependencies [76f6239ff1a9f34f163c03c140c4ceba62563b4e, c43220dcd8c1df86a6143d6553964ad2173903b3, 76f6239ff1a9f34f163c03c140c4ceba62563b4e, 76f6239ff1a9f34f163c03c140c4ceba62563b4e]:</summary>
  - @rocket.chat/ui-contexts@14.0.0

  </details>

## 14.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@14.0.0-rc.3

  </details>

## 14.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies [c43220dcd8c1df86a6143d6553964ad2173903b3]:</summary>
  - @rocket.chat/ui-contexts@14.0.0-rc.2

  </details>

## 14.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@14.0.0-rc.1

  </details>

## 14.0.0-rc.0

### Patch Changes

- <details><summary>Updated dependencies [76f6239ff1a9f34f163c03c140c4ceba62563b4e, 76f6239ff1a9f34f163c03c140c4ceba62563b4e, 76f6239ff1a9f34f163c03c140c4ceba62563b4e]:</summary>
  - @rocket.chat/ui-contexts@14.0.0-rc.0

  </details>

## 13.0.0

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@13.0.0

  </details>

## 13.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@13.0.0-rc.3

  </details>

## 13.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@13.0.0-rc.2

  </details>

## 13.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@13.0.0-rc.1

  </details>

## 13.0.0-rc.0

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@13.0.0-rc.0

  </details>

## 12.0.0

### Patch Changes

- ([#33333](https://github.com/RocketChat/Rocket.Chat/pull/33333)) Login services button was not respecting the button color and text color settings. Implemented a fix to respect these settings and change the button colors accordingly.

  Added a warning on all settings which allow admins to change OAuth button colors, so that they can be alerted about WCAG (Web Content Accessibility Guidelines) compliance.

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@12.0.0

  </details>

## 12.0.0-rc.6

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@12.0.0-rc.6

  </details>

## 12.0.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@12.0.0-rc.5

  </details>

## 12.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@12.0.0-rc.4

  </details>

## 12.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@12.0.0-rc.3

  </details>

## 12.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@12.0.0-rc.2

  </details>

## 12.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@12.0.0-rc.1

  </details>

## 12.0.0-rc.0

### Patch Changes

- ([#33333](https://github.com/RocketChat/Rocket.Chat/pull/33333)) Login services button was not respecting the button color and text color settings. Implemented a fix to respect these settings and change the button colors accordingly.

  Added a warning on all settings which allow admins to change OAuth button colors, so that they can be alerted about WCAG (Web Content Accessibility Guidelines) compliance.

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@12.0.0-rc.0

  </details>

## 11.0.0

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@11.0.0

  </details>

## 11.0.0-rc.6

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@11.0.0-rc.6

  </details>

## 11.0.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@11.0.0-rc.5

  </details>

## 11.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@11.0.0-rc.4

  </details>

## 11.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@11.0.0-rc.3

  </details>

## 11.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@11.0.0-rc.2

  </details>

## 11.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@11.0.0-rc.1

  </details>

## 11.0.0-rc.0

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
- @rocket.chat/ui-contexts@11.0.0-rc.0
  </details>

## 10.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@10.0.1

  </details>

## 10.0.0

### Patch Changes

- ([#32743](https://github.com/RocketChat/Rocket.Chat/pull/32743)) Fixes an issue where creating a new user with an invalid username (containing special characters) resulted in an error message, but the user was still created. The user creation process now properly aborts when an invalid username is provided.

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@10.0.0

  </details>

## 10.0.0-rc.6

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@10.0.0-rc.6

  </details>

## 10.0.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@10.0.0-rc.5

  </details>

## 10.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@10.0.0-rc.4

  </details>

## 10.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@10.0.0-rc.3

  </details>

## 10.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@10.0.0-rc.2

  </details>

## 10.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@10.0.0-rc.1

  </details>

## 10.0.0-rc.0

### Patch Changes

- ([#32743](https://github.com/RocketChat/Rocket.Chat/pull/32743)) Fixes an issue where creating a new user with an invalid username (containing special characters) resulted in an error message, but the user was still created. The user creation process now properly aborts when an invalid username is provided.

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@10.0.0-rc.0

  </details>

## 9.0.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@9.0.2

  </details>

## 9.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@9.0.1

  </details>

## 9.0.0

### Patch Changes

- ([#32482](https://github.com/RocketChat/Rocket.Chat/pull/32482)) Fixed an issue with blocked login when dismissed 2FA modal by clicking outside of it or pressing the escape key

- <details><summary>Updated dependencies [8fc6ca8b4e, 2d89a0c448, 4e8aa575a6]:</summary>
  - @rocket.chat/tools@0.2.2
  - @rocket.chat/ui-contexts@9.0.0

  </details>

## 9.0.0-rc.6

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@9.0.0-rc.6

  </details>

## 9.0.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@9.0.0-rc.5

  </details>

## 9.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@9.0.0-rc.4

  </details>

## 9.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@9.0.0-rc.3

  </details>

## 9.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@9.0.0-rc.2

  </details>

## 9.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@9.0.0-rc.1

  </details>

## 9.0.0-rc.0

### Patch Changes

- ([#32570](https://github.com/RocketChat/Rocket.Chat/pull/32570)) Login services button was not respecting the button color and text color settings. Implemented a fix to respect these settings and change the button colors accordingly.

  Added a warning on all settings which allow admins to change OAuth button colors, so that they can be alerted about WCAG (Web Content Accessibility Guidelines) compliance.

- ([#32482](https://github.com/RocketChat/Rocket.Chat/pull/32482)) Fixed an issue with blocked login when dismissed 2FA modal by clicking outside of it or pressing the escape key

- <details><summary>Updated dependencies [8fc6ca8b4e, 2d89a0c448, 4e8aa575a6]:</summary>
  - @rocket.chat/tools@0.2.2-rc.0
  - @rocket.chat/ui-contexts@9.0.0-rc.0

  </details>

## 8.0.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@8.0.2

  </details>

## 8.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@8.0.1

  </details>

## 8.0.0

### Minor Changes

- ([#31821](https://github.com/RocketChat/Rocket.Chat/pull/31821)) New runtime for apps in the Apps-Engine based on the Deno platform

### Patch Changes

- <details><summary>Updated dependencies [4f72d62aa7]:</summary>
  - @rocket.chat/ui-contexts@8.0.0

  </details>

## 8.0.0-rc.7

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@8.0.0-rc.7

  </details>

## 8.0.0-rc.6

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@8.0.0-rc.6

  </details>

## 8.0.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@8.0.0-rc.5

  </details>

## 8.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@8.0.0-rc.4

  </details>

## 8.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@8.0.0-rc.3

  </details>

## 8.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@8.0.0-rc.2

  </details>

## 8.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@8.0.0-rc.1

  </details>

## 8.0.0-rc.0

### Minor Changes

- ([#31821](https://github.com/RocketChat/Rocket.Chat/pull/31821)) New runtime for apps in the Apps-Engine based on the Deno platform

### Patch Changes

- <details><summary>Updated dependencies [4f72d62aa7]:</summary>
  - @rocket.chat/ui-contexts@8.0.0-rc.0

## 7.0.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@7.0.3

  </details>

## 7.0.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@7.0.2

  </details>

## 7.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@7.0.1

  </details>

## 7.0.0

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@7.0.0

  </details>

## 7.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@7.0.0-rc.2

  </details>

## 7.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@7.0.0-rc.1

  </details>

## 7.0.0-rc.0

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@7.0.0-rc.0

  </details>

## 6.0.0

### Patch Changes

- <details><summary>Updated dependencies [c0d54d742a]:</summary>
  - @rocket.chat/ui-contexts@6.0.0

  </details>

## 6.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@6.0.0-rc.2

  </details>

## 6.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@6.0.0-rc.1

  </details>

## 6.0.0-rc.0

### Patch Changes

- <details><summary>Updated dependencies [c0d54d742a]:</summary>
  - @rocket.chat/ui-contexts@6.0.0-rc.0

## 5.0.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@5.0.2

  </details>

## 5.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@5.0.1

  </details>

## 5.0.0

### Patch Changes

- ([#31583](https://github.com/RocketChat/Rocket.Chat/pull/31583)) Fixed login email verification flow when a user tries to join with username

- ([#31804](https://github.com/RocketChat/Rocket.Chat/pull/31804)) fixed the login page crashing when receiving unexpected errors

- ([#31625](https://github.com/RocketChat/Rocket.Chat/pull/31625) by [@abhipatel0211](https://github.com/abhipatel0211)) Fixed a bug that caused the Login page to crash when closing the Two-Factor Authentication modal using the Cancel button or the X button.

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@5.0.0

  </details>

## 5.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@5.0.0-rc.4

  </details>

## 5.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@5.0.0-rc.3

  </details>

## 5.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@5.0.0-rc.2

  </details>

## 5.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@5.0.0-rc.1

  </details>

## 5.0.0-rc.0

### Patch Changes

- ([#31583](https://github.com/RocketChat/Rocket.Chat/pull/31583)) Fixed login email verification flow when a user tries to join with username

- ([#31804](https://github.com/RocketChat/Rocket.Chat/pull/31804)) fixed the login page crashing when receiving unexpected errors

- ([#31625](https://github.com/RocketChat/Rocket.Chat/pull/31625) by [@abhipatel0211](https://github.com/abhipatel0211)) Fixed a bug that caused the Login page to crash when closing the Two-Factor Authentication modal using the Cancel button or the X button.

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@5.0.0-rc.0

  </details>

## 4.0.6

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@4.0.6

  </details>

## 4.0.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@4.0.5

  </details>

## 4.0.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@4.0.4

  </details>

## 4.0.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@4.0.3

  </details>

## 4.0.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@4.0.2

  </details>

## 4.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@4.0.1

  </details>

## 4.0.0

### Minor Changes

- ([#30680](https://github.com/RocketChat/Rocket.Chat/pull/30680)) feat: Skip to main content shortcut and useDocumentTitle

### Patch Changes

- ([#31138](https://github.com/RocketChat/Rocket.Chat/pull/31138)) feat(uikit): Move `@rocket.chat/ui-kit` package to the main monorepo

- <details><summary>Updated dependencies [b223cbde14, b2b0035162]:</summary>
  - @rocket.chat/ui-contexts@4.0.0
  - @rocket.chat/tools@0.2.1

  </details>

## 4.0.0-rc.7

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@4.0.0-rc.7

  </details>

## 4.0.0-rc.6

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@4.0.0-rc.6

  </details>

## 4.0.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@4.0.0-rc.5

  </details>

## 4.0.0-rc.4

### Patch Changes

- @rocket.chat/ui-contexts@4.0.0-rc.4

## 4.0.0-rc.3

### Patch Changes

- @rocket.chat/ui-contexts@4.0.0-rc.3

## 4.0.0-rc.2

### Patch Changes

- @rocket.chat/ui-contexts@4.0.0-rc.2

## 4.0.0-rc.1

### Patch Changes

- @rocket.chat/ui-contexts@4.0.0-rc.1

## 4.0.0-rc.0

### Minor Changes

- dd5fd6d2c8: feat: Skip to main content shortcut and useDocumentTitle

### Patch Changes

- b223cbde14: feat(uikit): Move `@rocket.chat/ui-kit` package to the main monorepo
- Updated dependencies [b223cbde14]
- Updated dependencies [b2b0035162]
  - @rocket.chat/ui-contexts@4.0.0-rc.0
  - @rocket.chat/tools@0.2.1-rc.0

## 3.0.3

### Patch Changes

- @rocket.chat/ui-contexts@3.0.3

## 3.0.2

### Patch Changes

- @rocket.chat/ui-contexts@3.0.2

## 3.0.1

### Patch Changes

- @rocket.chat/ui-contexts@3.0.1

## 3.0.0

### Patch Changes

- 7da1edf866: Fixed an issue in the invite registration flow in which the user would not be automatically redirected to the homepage upon succesfully submiting the user registration form.
- Updated dependencies [7da1edf866]
- Updated dependencies [92613680b7]
  - @rocket.chat/ui-contexts@3.0.0
  - @rocket.chat/tools@0.2.0

## 3.0.0-rc.18

### Patch Changes

- @rocket.chat/ui-contexts@3.0.0-rc.19

## 3.0.0-rc.17

### Patch Changes

- @rocket.chat/ui-contexts@3.0.0-rc.18

## 3.0.0-rc.16

### Patch Changes

- @rocket.chat/ui-contexts@3.0.0-rc.17

## 3.0.0-rc.15

### Patch Changes

- @rocket.chat/ui-contexts@3.0.0-rc.16

## 3.0.0-rc.14

### Patch Changes

- @rocket.chat/ui-contexts@3.0.0-rc.15

## 3.0.0-rc.13

### Patch Changes

- @rocket.chat/ui-contexts@3.0.0-rc.14

## 3.0.0-rc.12

### Patch Changes

- @rocket.chat/ui-contexts@3.0.0-rc.13

## 3.0.0-rc.11

### Patch Changes

- @rocket.chat/ui-contexts@3.0.0-rc.12

## 3.0.0-rc.10

### Patch Changes

- @rocket.chat/ui-contexts@3.0.0-rc.11

## 3.0.0-rc.9

### Patch Changes

- @rocket.chat/ui-contexts@3.0.0-rc.10

## 3.0.0-rc.8

### Patch Changes

- @rocket.chat/ui-contexts@3.0.0-rc.9

## 3.0.0-rc.7

### Patch Changes

- @rocket.chat/ui-contexts@3.0.0-rc.8

## 3.0.0-rc.6

### Patch Changes

- @rocket.chat/ui-contexts@3.0.0-rc.7

## 3.0.0-rc.5

### Patch Changes

- @rocket.chat/ui-contexts@3.0.0-rc.6

## 3.0.0-rc.4

### Patch Changes

- @rocket.chat/ui-contexts@3.0.0-rc.5

## 3.0.0-rc.3

### Patch Changes

- @rocket.chat/ui-contexts@3.0.0-rc.4

## 3.0.0-rc.2

### Patch Changes

- @rocket.chat/ui-contexts@3.0.0-rc.2

## 3.0.0-rc.1

### Patch Changes

- @rocket.chat/ui-contexts@3.0.0-rc.1

## 3.0.0-rc.0

### Patch Changes

- 7da1edf866: Fixed an issue in the invite registration flow in which the user would not be automatically redirected to the homepage upon succesfully submiting the user registration form.
- Updated dependencies [7da1edf866]
  - @rocket.chat/ui-contexts@3.0.0-rc.0

## 2.0.8

### Patch Changes

- @rocket.chat/ui-contexts@2.0.8

## 2.0.7

### Patch Changes

- @rocket.chat/ui-contexts@2.0.7

## 2.0.6

### Patch Changes

- @rocket.chat/ui-contexts@2.0.6

## 2.0.5

### Patch Changes

- @rocket.chat/ui-contexts@2.0.5

## 2.0.4

### Patch Changes

- @rocket.chat/ui-contexts@2.0.4

## 2.0.3

### Patch Changes

- @rocket.chat/ui-contexts@2.0.3

## 2.0.2

### Patch Changes

- @rocket.chat/ui-contexts@2.0.2

## 2.0.1

### Patch Changes

- @rocket.chat/ui-contexts@2.0.1

## 2.0.0

### Patch Changes

- b8f3d5014f: Fixed the login page language switcher, now the component has a new look, is reactive and the language selection becomes concrete upon login in. Also changed the default language of the login page to be the browser language.
- Updated dependencies [074db3b419]
- Updated dependencies [b8f3d5014f]
  - @rocket.chat/ui-contexts@2.0.0

## 2.0.0-rc.5

### Patch Changes

- @rocket.chat/ui-contexts@2.0.0-rc.5

## 2.0.0-rc.4

### Patch Changes

- @rocket.chat/ui-contexts@2.0.0-rc.4

## 2.0.0-rc.3

### Patch Changes

- @rocket.chat/ui-contexts@2.0.0-rc.3

## 2.0.0-rc.2

### Patch Changes

- @rocket.chat/ui-contexts@2.0.0-rc.2

## 2.0.0-rc.1

### Patch Changes

- @rocket.chat/ui-contexts@2.0.0-rc.1

## 2.0.0-rc.0

### Patch Changes

- b8f3d5014f: Fixed the login page language switcher, now the component has a new look, is reactive and the language selection becomes concrete upon login in. Also changed the default language of the login page to be the browser language.
- Updated dependencies [074db3b419]
- Updated dependencies [b8f3d5014f]
  - @rocket.chat/ui-contexts@2.0.0-rc.0

## 1.0.8

### Patch Changes

- @rocket.chat/ui-contexts@1.0.8

## 1.0.7

### Patch Changes

- @rocket.chat/ui-contexts@1.0.7

## 1.0.6

### Patch Changes

- @rocket.chat/ui-contexts@1.0.6

## 1.0.5

### Patch Changes

- @rocket.chat/ui-contexts@1.0.5

## 1.0.4

### Patch Changes

- @rocket.chat/ui-contexts@1.0.4

## 1.0.3

### Patch Changes

- @rocket.chat/ui-contexts@1.0.3

## 1.0.2

### Patch Changes

- @rocket.chat/ui-contexts@1.0.2

## 1.0.1

### Patch Changes

- @rocket.chat/ui-contexts@1.0.1

## 1.0.0

### Minor Changes

- 4b5a87c88b: fix: Handle login services errors

### Patch Changes

- e14ec50816: Added and Improved Custom Fields form to Registration Flow
- ae39f91085: ✅ Added a new email validation in the Registration Form
- ebbb608166: fix: Login Terms custom content
  The custom layout Login Terms did not had any effect on the login screen, so it was changed to get the proper setting effect
- f76d514341: Implemented a visual password verification in the Register User form, My Profile page, and reset password page. With this, the user will know exactly why their password is weak and how to improve it.
- 6938bcd1a2: fix: Manually approved user registration flow
  The new user gets redirected to the login page with a toast message saying:

  > Before you can login, your account must be manually activated by an administrator.

- Updated dependencies [e14ec50816]
- Updated dependencies [f76d514341]
  - @rocket.chat/ui-contexts@1.0.0

## 1.0.0-rc.10

### Patch Changes

- @rocket.chat/ui-contexts@1.0.0-rc.10

## 1.0.0-rc.9

### Patch Changes

- @rocket.chat/ui-contexts@1.0.0-rc.9

## 1.0.0-rc.8

### Patch Changes

- @rocket.chat/ui-contexts@1.0.0-rc.8

## 1.0.0-rc.7

### Patch Changes

- @rocket.chat/ui-contexts@1.0.0-rc.7

## 1.0.0-rc.6

### Patch Changes

- @rocket.chat/ui-contexts@1.0.0-rc.6

## 1.0.0-rc.5

### Patch Changes

- @rocket.chat/ui-contexts@1.0.0-rc.5

## 1.0.0-rc.4

### Patch Changes

- @rocket.chat/ui-contexts@1.0.0-rc.4

## 1.0.0-rc.3

### Patch Changes

- @rocket.chat/ui-contexts@1.0.0-rc.3

## 1.0.0-rc.2

### Patch Changes

- f76d514341: Implemented a visual password verification in the Register User form, My Profile page, and reset password page. With this, the user will know exactly why their password is weak and how to improve it.
- Updated dependencies [f76d514341]
  - @rocket.chat/ui-contexts@1.0.0-rc.2

## 1.0.0-rc.1

### Patch Changes

- @rocket.chat/ui-contexts@1.0.0-rc.1

## 1.0.0-rc.0

### Minor Changes

- 4b5a87c88b: fix: Handle login services errors

### Patch Changes

- e14ec50816: Added and Improved Custom Fields form to Registration Flow
- ae39f91085: ✅ Added a new email validation in the Registration Form
- ebbb608166: fix: Login Terms custom content
  The custom layout Login Terms did not had any effect on the login screen, so it was changed to get the proper setting effect
- 6938bcd1a2: fix: Manually approved user registration flow
  The new user gets redirected to the login page with a toast message saying:

  > Before you can login, your account must be manually activated by an administrator.

- Updated dependencies [e14ec50816]
  - @rocket.chat/ui-contexts@1.0.0-rc.0
