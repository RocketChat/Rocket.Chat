# @rocket.chat/ui-voip

## 26.0.0-rc.0

### Major Changes

- ([#42568](https://github.com/RocketChat/Rocket.Chat/pull/42568)) Renames the user `freeSwitchExtension` attribute to `sipExtension`, since the VoIP extension is no longer tied to FreeSWITCH and works with any SIP router. Existing users are migrated automatically on upgrade. REST API integrations must switch to the new name: the `users.create` and `users.update` parameters, the `users.info` query parameter, and the `sipExtension` field returned on user objects.

### Minor Changes

- ([#41946](https://github.com/RocketChat/Rocket.Chat/pull/41946)) Adds a new permission "Share screen during voice calls" which controls access to the feature. Users without this permission will still be able to see other participants screens during a voice call, but won't be able to share theirs.

- ([#42818](https://github.com/RocketChat/Rocket.Chat/pull/42818)) Renders autocompletes, UiKit selects, room members, banned users, team channels and call member lists with the `Item` rows, and names the icons of user and room options for assistive technology

- ([#40697](https://github.com/RocketChat/Rocket.Chat/pull/40697) by [@aleksandernsilva](https://github.com/aleksandernsilva)) Adds support for registering multiple phone numbers with labels per user. **Breaking:** the `phone` user field is replaced by the `phones` array (`{ number, label? }[]`); existing numbers are migrated automatically on upgrade.

- ([#42744](https://github.com/RocketChat/Rocket.Chat/pull/42744)) Adds a private **TURN servers** setting for voice calls. TURN servers and their credentials configured there are only handed to users on a call, instead of being readable by anyone through the public ICE servers setting. Each server can use fixed credentials or a shared secret, in which case the workspace issues each user time-limited credentials for every call and the secret never leaves the server (TURN REST API, as supported by coturn's `use-auth-secret`).

- ([#41224](https://github.com/RocketChat/Rocket.Chat/pull/41224)) External calls will now only play the ringing sound effect once the call has been sent out from the server

### Patch Changes

- ([#41892](https://github.com/RocketChat/Rocket.Chat/pull/41892)) Fixes an issue with incoming voice call transfers not transitioning to "Connecting" state.

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

- ([#42660](https://github.com/RocketChat/Rocket.Chat/pull/42660)) Fixes the application crashing when voice calls are used in an insecure (non-HTTPS) context

- ([#42557](https://github.com/RocketChat/Rocket.Chat/pull/42557)) Fixes the voice call popout failing silently when a popup blocker hands back an already closed window

- <details><summary>Updated dependencies [0b9d5f8d2caad828653bd1abc237e24a9c730752, 12f0c0a9d48ded61bd12ba2e3dcee7b3d877e860, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 53bf8feb0c2075ee243d90c42ca2934098b93709, 869d443b5cb26b8edec590190452d3bae7521f74, d37feb9d90fb1759f259af6c0a03e1ea3b751f11, 64c940e44ac9b05ce5e63c13f98af2b521b83ad1, dd082311778ac467d36a72589bc675f1ab2b2cbe, 7fbb5676fe0d2c034f4c52586ab858b3796e5dc6, 5c7b25f68d677d8bdbde3ed4c56ad0bba60ce71d, 5c7b25f68d677d8bdbde3ed4c56ad0bba60ce71d, 4c379a0d016fcf010bab86ddd94a22ff2401606e, 766ac93fba3c991c79c9bfcb404f6ec7fd1e30f8, 7fbb5676fe0d2c034f4c52586ab858b3796e5dc6, 4c379a0d016fcf010bab86ddd94a22ff2401606e, ad08045f56e3921e88ed021aa2945c9ba670e5f5, cea4d4428a0d86c6fc868542d4fb00a36ffaa27d, 7fbb5676fe0d2c034f4c52586ab858b3796e5dc6, 4c379a0d016fcf010bab86ddd94a22ff2401606e, 25fd477c2c38f71e9a16b7e2896d39efd43bfc61, 05e9b38a001919252360351f0bc3e46cc990a6ac, 25fd477c2c38f71e9a16b7e2896d39efd43bfc61, 2184b09b0bdacdb0bced60dc054a818a92c98131, e1b509fbca35eba10e21e4aa3bc15c56f44a2845, 0285f08c086dae6beb0f1365a85f522fb4818435, 6b86dffd3a05f65fff000bb697fbb40350664629, 5e6b6bd25ea82b9c884d49871870f71dc532a061, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 588311c49bfce08e7106e7c0bb32741334fa5321, c637a035450ca2241bb04692f276921592e513f6, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, e1b509fbca35eba10e21e4aa3bc15c56f44a2845, c12e5836df7fc5a4c9ee7a760c6101cb0ee8474a, 2d3331be63dde3449245963c33444dcb15fa8869, f5e483d062fed3e13b07ffd200ba5f04a88a4370, 05bbcccf3779fe8df3c96c6d80c4ce0d56bf6e9c, a9b2bb76d88e4d2743e0817b15e6447e7c9c46eb, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, bb69cb6c2e190cc3dffe33c3970f0e7c706d24a1, a838cc5af0652f59d0ab30aa1a488abded0622b1, 52fdf8ea1b17b08482cf8cb21156f1be7b80844c, daa677895dad92d6aab1e84a09f190efd2755ef9, 5e7e4a8aa389be0d3d4ace0861c646069151674d, 87667dcb84de0ce97f4ace88c900801254fa6535, 87667dcb84de0ce97f4ace88c900801254fa6535, 87667dcb84de0ce97f4ace88c900801254fa6535, 87667dcb84de0ce97f4ace88c900801254fa6535, 87667dcb84de0ce97f4ace88c900801254fa6535, c3e4da2025942803ddcf19f5298fe707e37bf9c4, 05e9b38a001919252360351f0bc3e46cc990a6ac, cd88334c72f7f2310706abc4d481a2712019e373, 05e9b38a001919252360351f0bc3e46cc990a6ac, ec12f66a28435f99fbce9cbb00ef49193f5b0d34, 9dfedc72439d12f5d2985b9dd54daccd97e11e74, ec12f66a28435f99fbce9cbb00ef49193f5b0d34, ec12f66a28435f99fbce9cbb00ef49193f5b0d34, ec12f66a28435f99fbce9cbb00ef49193f5b0d34, 9dfedc72439d12f5d2985b9dd54daccd97e11e74, ec12f66a28435f99fbce9cbb00ef49193f5b0d34, ec12f66a28435f99fbce9cbb00ef49193f5b0d34, ec12f66a28435f99fbce9cbb00ef49193f5b0d34, ec12f66a28435f99fbce9cbb00ef49193f5b0d34, 7ae0f74b707a943b543f034369388387fe0dc10c, 23698f9d08d34d3c145f116b5303b542e8342f9e, ec12f66a28435f99fbce9cbb00ef49193f5b0d34, ec12f66a28435f99fbce9cbb00ef49193f5b0d34, 1a997506d74bff2afa933dd2b9403ff9d2e6d5bb, ec12f66a28435f99fbce9cbb00ef49193f5b0d34, ec12f66a28435f99fbce9cbb00ef49193f5b0d34, ec12f66a28435f99fbce9cbb00ef49193f5b0d34, 23698f9d08d34d3c145f116b5303b542e8342f9e, 9dfedc72439d12f5d2985b9dd54daccd97e11e74, e1070288debfecc5e49e118c3dc535f95936281f, 9dfedc72439d12f5d2985b9dd54daccd97e11e74, 982270a515cc061aafccb82a0605a36ce929d56c, 8fddbd4ebf2e4ac77a716b22a676077054506b7b, 5e7e4a8aa389be0d3d4ace0861c646069151674d, 5e7e4a8aa389be0d3d4ace0861c646069151674d]:</summary>
  - @rocket.chat/fuselage-ui-kit@36.0.0-rc.0
  - @rocket.chat/fuselage@1.0.0-rc.0
  - @rocket.chat/ui-contexts@36.0.0-rc.0
  - @rocket.chat/desktop-api@1.5.0-rc.0
  - @rocket.chat/emitter@0.33.1-rc.0
  - @rocket.chat/fuselage-hooks@0.44.0-rc.0
  - @rocket.chat/ui-client@36.0.0-rc.0
  - @rocket.chat/icons@0.52.0-rc.0
  - @rocket.chat/ui-media@1.0.0-rc.0
  - @rocket.chat/media-signaling@1.4.0-rc.0
  - @rocket.chat/styled@0.34.2-rc.0
  - @rocket.chat/ui-avatar@32.0.0-rc.0
  - @rocket.chat/css-in-js@0.33.3-rc.0

  </details>

## 25.0.0

### Minor Changes

- ([#41964](https://github.com/RocketChat/Rocket.Chat/pull/41964)) Improves the logic of when the Busy Tone should be played after a call ends

- ([#40484](https://github.com/RocketChat/Rocket.Chat/pull/40484) by [@aleksandernsilva](https://github.com/aleksandernsilva)) Adds name and avatar resolution for external voice calls

- ([#41681](https://github.com/RocketChat/Rocket.Chat/pull/41681)) Adds media call lifecycle events to the Apps-Engine: an app implementing the new `IMediaCallHandler` interface can now observe calls starting, being answered and ending, and can block a call or change the features it was requested with before it is created

- ([#41944](https://github.com/RocketChat/Rocket.Chat/pull/41944)) Improved the in-call voice widget: media elements no longer detach and re-attach when an unrelated device changes, so a shared screen or camera stops blinking whenever the microphone is muted or a device is switched.

### Patch Changes

- ([#42291](https://github.com/RocketChat/Rocket.Chat/pull/42291)) Fixes the new call autocomplete listing two indistinguishable options when a result reads exactly as what was typed

- ([#42173](https://github.com/RocketChat/Rocket.Chat/pull/42173)) Fixes the Voice Call Widget to show the correct call duration after navigating through DMs

- <details><summary>Updated dependencies [3e51ba30e3d48a418adb3bfa1bd41fa69cf636e9, eeca122b913518d2231f9d9568a10873705845ee, 639dcb1a2d2116eeb956c7dfc7890b48cbdf9782, 4be043d9356fd50d2e3e1b585008368f90e95505, 398c880403670d5669b9ece05f3981cfe31ee6c4, 71add68eca423511c0189f2f541b5a2c46a5e7a0, 71cb69992cf9f6a85fff7278dbf5481b64b5c735, 6843a962e18a7c37986bc08e8a7cc9bbd8072b77, 37faaa89ad1b4b721d6054e40a91327bd8140525, e61b41d340e2722037de67551982fd70773d0617]:</summary>
  - @rocket.chat/media-signaling@1.3.0
  - @rocket.chat/ui-client@35.0.0
  - @rocket.chat/css-in-js@0.33.2
  - @rocket.chat/desktop-api@1.4.0
  - @rocket.chat/fuselage-ui-kit@35.0.0
  - @rocket.chat/ui-avatar@31.0.0
  - @rocket.chat/ui-contexts@35.0.0

  </details>

## 25.0.0-rc.0

### Minor Changes

- ([#41964](https://github.com/RocketChat/Rocket.Chat/pull/41964)) Improves the logic of when the Busy Tone should be played after a call ends

- ([#40484](https://github.com/RocketChat/Rocket.Chat/pull/40484) by [@aleksandernsilva](https://github.com/aleksandernsilva)) Adds name and avatar resolution for external voice calls

- ([#41681](https://github.com/RocketChat/Rocket.Chat/pull/41681)) Adds media call lifecycle events to the Apps-Engine: an app implementing the new `IMediaCallHandler` interface can now observe calls starting, being answered and ending, and can block a call or change the features it was requested with before it is created

- ([#41944](https://github.com/RocketChat/Rocket.Chat/pull/41944)) Improved the in-call voice widget: media elements no longer detach and re-attach when an unrelated device changes, so a shared screen or camera stops blinking whenever the microphone is muted or a device is switched.

### Patch Changes

- ([#42291](https://github.com/RocketChat/Rocket.Chat/pull/42291)) Fixes the new call autocomplete listing two indistinguishable options when a result reads exactly as what was typed

- ([#42173](https://github.com/RocketChat/Rocket.Chat/pull/42173)) Fixes the Voice Call Widget to show the correct call duration after navigating through DMs

- <details><summary>Updated dependencies [3e51ba30e3d48a418adb3bfa1bd41fa69cf636e9, eeca122b913518d2231f9d9568a10873705845ee, 639dcb1a2d2116eeb956c7dfc7890b48cbdf9782, 4be043d9356fd50d2e3e1b585008368f90e95505, 398c880403670d5669b9ece05f3981cfe31ee6c4, 71add68eca423511c0189f2f541b5a2c46a5e7a0, 71cb69992cf9f6a85fff7278dbf5481b64b5c735, 6843a962e18a7c37986bc08e8a7cc9bbd8072b77, 37faaa89ad1b4b721d6054e40a91327bd8140525, e61b41d340e2722037de67551982fd70773d0617]:</summary>
  - @rocket.chat/media-signaling@1.3.0-rc.0
  - @rocket.chat/ui-client@35.0.0-rc.0
  - @rocket.chat/css-in-js@0.33.2-rc.0
  - @rocket.chat/desktop-api@1.4.0-rc.0
  - @rocket.chat/fuselage-ui-kit@35.0.0-rc.0
  - @rocket.chat/ui-contexts@35.0.0-rc.0
  - @rocket.chat/ui-avatar@31.0.0-rc.0

  </details>

## 24.0.0

### Minor Changes

- ([#41416](https://github.com/RocketChat/Rocket.Chat/pull/41416)) Removes voice calling microphone requirement for starting a successful call, allowing users to join as "listen-only".

- ([#41954](https://github.com/RocketChat/Rocket.Chat/pull/41954)) Promotes Voice Call Screen Sharing to stable by removing the `beta` alert from its setting and enabling the "In-Room" call interface for every call regardless of screen-share availability.

### Patch Changes

- <details><summary>Updated dependencies [4947601bbf042cd1b2385f8f5dda438e608faea7, 7b7f88ffa061d72db8297e9e62d72c3ab94603ab, 742009a09148e33d141f50691cdec0f7e9818535]:</summary>
  - @rocket.chat/ui-client@34.0.0
  - @rocket.chat/media-signaling@1.2.0
  - @rocket.chat/fuselage-ui-kit@34.0.0
  - @rocket.chat/ui-avatar@30.0.0
  - @rocket.chat/ui-contexts@34.0.0

  </details>

## 24.0.0-rc.1

### Minor Changes

- ([#41954](https://github.com/RocketChat/Rocket.Chat/pull/41954)) Promotes Voice Call Screen Sharing to stable by removing the `beta` alert from its setting and enabling the "In-Room" call interface for every call regardless of screen-share availability.

## 24.0.0-rc.0

### Minor Changes

- ([#41416](https://github.com/RocketChat/Rocket.Chat/pull/41416)) Removes voice calling microphone requirement for starting a successful call, allowing users to join as "listen-only".

### Patch Changes

- <details><summary>Updated dependencies [4947601bbf042cd1b2385f8f5dda438e608faea7, 7b7f88ffa061d72db8297e9e62d72c3ab94603ab, 742009a09148e33d141f50691cdec0f7e9818535]:</summary>
  - @rocket.chat/ui-client@34.0.0-rc.0
  - @rocket.chat/media-signaling@1.2.0-rc.0
  - @rocket.chat/ui-contexts@34.0.0-rc.0
  - @rocket.chat/emitter@0.33.0
  - @rocket.chat/fuselage-ui-kit@34.0.0-rc.0
  - @rocket.chat/ui-avatar@30.0.0-rc.0

  </details>

## 23.0.0

### Patch Changes

- ([#41200](https://github.com/RocketChat/Rocket.Chat/pull/41200)) Fixes an issue where the whole app remounts when VoIP availability changes

- <details><summary>Updated dependencies [13b4a7b2dc203959b77b3b0c5f154d3e34fe2058, 0433f003d2bbe74fbbf4970d756df86ca44ac055, 4b57346a59b5c9433c25845c886be11af1bf71d4]:</summary>
  - @rocket.chat/desktop-api@1.3.0
  - @rocket.chat/ui-client@33.0.0
  - @rocket.chat/fuselage-ui-kit@33.0.0
  - @rocket.chat/ui-avatar@29.0.0
  - @rocket.chat/ui-contexts@33.0.0

  </details>

## 23.0.0-rc.0

### Patch Changes

- ([#41200](https://github.com/RocketChat/Rocket.Chat/pull/41200)) Fixes an issue where the whole app remounts when VoIP availability changes

- <details><summary>Updated dependencies [13b4a7b2dc203959b77b3b0c5f154d3e34fe2058, 0433f003d2bbe74fbbf4970d756df86ca44ac055, 4b57346a59b5c9433c25845c886be11af1bf71d4]:</summary>
  - @rocket.chat/desktop-api@1.3.0-rc.0
  - @rocket.chat/ui-client@33.0.0-rc.0
  - @rocket.chat/fuselage-ui-kit@33.0.0-rc.0
  - @rocket.chat/ui-contexts@33.0.0-rc.0
  - @rocket.chat/ui-avatar@29.0.0-rc.0

  </details>

## 22.0.0

### Minor Changes

- ([#40202](https://github.com/RocketChat/Rocket.Chat/pull/40202)) Introduces popout functionality for voice calls

### Patch Changes

- ([#41060](https://github.com/RocketChat/Rocket.Chat/pull/41060) by [@aleksandernsilva](https://github.com/aleksandernsilva)) Fixes voice call UI not reflecting active call state when a new view mounted while a call was already active (e.g. opening the popout window)

- <details><summary>Updated dependencies [ebc9c17b6ba63ee754320eadfba20c024c53c18f, 5d5edd8520ddb424bd336e3ec802c1f4a4e7d1ce]:</summary>
  - @rocket.chat/media-signaling@1.1.0
  - @rocket.chat/fuselage-ui-kit@32.0.0
  - @rocket.chat/ui-avatar@28.0.0
  - @rocket.chat/ui-client@32.0.0
  - @rocket.chat/ui-contexts@32.0.0

  </details>

## 22.0.0-rc.1

### Patch Changes

- ([#41060](https://github.com/RocketChat/Rocket.Chat/pull/41060)) Fixes voice call UI not reflecting active call state when a new view mounted while a call was already active (e.g. opening the popout window)

- <details><summary>Updated dependencies [5d5edd8520ddb424bd336e3ec802c1f4a4e7d1ce]:</summary>
  - @rocket.chat/media-signaling@1.1.0-rc.1

  </details>

## 22.0.0-rc.0

### Minor Changes

- ([#40202](https://github.com/RocketChat/Rocket.Chat/pull/40202)) Introduces popout functionality for voice calls

### Patch Changes

- <details><summary>Updated dependencies [ebc9c17b6ba63ee754320eadfba20c024c53c18f]:</summary>
  - @rocket.chat/media-signaling@1.1.0-rc.0
  - @rocket.chat/ui-contexts@32.0.0-rc.0
  - @rocket.chat/ui-client@32.0.0-rc.0
  - @rocket.chat/fuselage-ui-kit@32.0.0-rc.0
  - @rocket.chat/ui-avatar@28.0.0-rc.0

  </details>

## 21.0.0

### Minor Changes

- ([#40331](https://github.com/RocketChat/Rocket.Chat/pull/40331)) Adds "Open in room" button to shared screen card on voice call widget

### Patch Changes

- ([#40330](https://github.com/RocketChat/Rocket.Chat/pull/40330)) Fixes an issue where intentionally cancelling a screen share request would show an error toast by identifying error types and counting consecutive failures.

- <details><summary>Updated dependencies [fac64728505b312d5da786e92d3134450ce4a7c1]:</summary>
  - @rocket.chat/ui-client@31.0.0
  - @rocket.chat/desktop-api@1.2.0
  - @rocket.chat/fuselage-ui-kit@31.0.0
  - @rocket.chat/ui-avatar@27.0.0
  - @rocket.chat/ui-contexts@31.0.0

  </details>

## 21.0.0-rc.0

### Minor Changes

- ([#40331](https://github.com/RocketChat/Rocket.Chat/pull/40331)) Adds "Open in room" button to shared screen card on voice call widget

### Patch Changes

- ([#40330](https://github.com/RocketChat/Rocket.Chat/pull/40330)) Fixes an issue where intentionally cancelling a screen share request would show an error toast by identifying error types and counting consecutive failures.

- <details><summary>Updated dependencies [ae9f740d6af20557eac61b4af902c868b4132b49, fac64728505b312d5da786e92d3134450ce4a7c1]:</summary>
  - @rocket.chat/desktop-api@1.2.0-rc.0
  - @rocket.chat/ui-client@31.0.0-rc.0
  - @rocket.chat/fuselage-ui-kit@31.0.0-rc.0
  - @rocket.chat/ui-contexts@31.0.0-rc.0
  - @rocket.chat/ui-avatar@27.0.0-rc.0

  </details>

## 20.0.0

### Minor Changes

- ([#40093](https://github.com/RocketChat/Rocket.Chat/pull/40093)) Adds new API endpoints to load the user's current voice call state from the server

### Patch Changes

- ([#39741](https://github.com/RocketChat/Rocket.Chat/pull/39741)) Fixes empty notifications sent when a voice call ends

- <details><summary>Updated dependencies [543b6c8cbde0d084a3a923acf4845b68db80206a, 2632182e429d337325fe3b1e28ea52ab12d99591, 21cd54f87de5837fe6c999a44bd15be34b9fe905, c544b805d1c03f8eae9d061cd48838206207a7c9]:</summary>
  - @rocket.chat/ui-client@30.0.0
  - @rocket.chat/media-signaling@1.0.0
  - @rocket.chat/fuselage-ui-kit@30.0.0
  - @rocket.chat/ui-avatar@26.0.0
  - @rocket.chat/ui-contexts@30.0.0

  </details>

## 20.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/fuselage-ui-kit@30.0.0-rc.2
  - @rocket.chat/ui-avatar@26.0.0-rc.2
  - @rocket.chat/ui-client@30.0.0-rc.2
  - @rocket.chat/ui-contexts@30.0.0-rc.2

  </details>

## 20.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies [2632182e429d337325fe3b1e28ea52ab12d99591]:</summary>
  - @rocket.chat/media-signaling@1.0.0-rc.1
  - @rocket.chat/ui-contexts@30.0.0-rc.1
  - @rocket.chat/fuselage-ui-kit@30.0.0-rc.1
  - @rocket.chat/ui-avatar@26.0.0-rc.1
  - @rocket.chat/ui-client@30.0.0-rc.1

  </details>

## 19.0.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/fuselage-ui-kit@29.0.2
  - @rocket.chat/ui-avatar@25.0.2
  - @rocket.chat/ui-client@29.0.2
  - @rocket.chat/ui-contexts@29.0.2

  </details>

## 19.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/fuselage-ui-kit@29.0.1
  - @rocket.chat/ui-avatar@25.0.1
  - @rocket.chat/ui-client@29.0.1
  - @rocket.chat/ui-contexts@29.0.1

  </details>

## 20.0.0-rc.0

### Minor Changes

- ([#40093](https://github.com/RocketChat/Rocket.Chat/pull/40093)) Adds new API endpoints to load the user's current voice call state from the server

### Patch Changes

- ([#39741](https://github.com/RocketChat/Rocket.Chat/pull/39741)) Fixes empty notifications sent when a voice call ends

- <details><summary>Updated dependencies [543b6c8cbde0d084a3a923acf4845b68db80206a, 21cd54f87de5837fe6c999a44bd15be34b9fe905, c544b805d1c03f8eae9d061cd48838206207a7c9]:</summary>
  - @rocket.chat/ui-client@30.0.0-rc.0
  - @rocket.chat/media-signaling@0.3.0-rc.0
  - @rocket.chat/fuselage-ui-kit@30.0.0-rc.0
  - @rocket.chat/ui-avatar@26.0.0-rc.0
  - @rocket.chat/ui-contexts@30.0.0-rc.0

  </details>

## 19.0.0

### Minor Changes

- ([#37922](https://github.com/RocketChat/Rocket.Chat/pull/37922)) Introduces native screen sharing for internal voice calls. This feature is currently in beta and can be disabled through admin settings.

### Patch Changes

- ([#39670](https://github.com/RocketChat/Rocket.Chat/pull/39670)) Fixes mismatched translations for Voice calling UI

- ([#38989](https://github.com/RocketChat/Rocket.Chat/pull/38989)) chore(eslint): Upgrades ESLint and its configuration

- <details><summary>Updated dependencies [87f9262af4a543d52642a54e1ef546d509a79e23, 539659af22bc19880eda047dfc0b152472ccb65c, 1741a20dd86c353755becfc706cd9ad63df09cfa, 43d0cfc6a70e8a31d5f3d24162216dae6b07efdd]:</summary>
  - @rocket.chat/fuselage-ui-kit@29.0.0
  - @rocket.chat/media-signaling@0.2.0
  - @rocket.chat/desktop-api@1.1.1
  - @rocket.chat/ui-contexts@29.0.0
  - @rocket.chat/ui-avatar@25.0.0
  - @rocket.chat/ui-client@29.0.0

  </details>

## 19.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/fuselage-ui-kit@29.0.0-rc.4
  - @rocket.chat/ui-avatar@25.0.0-rc.4
  - @rocket.chat/ui-client@29.0.0-rc.4
  - @rocket.chat/ui-contexts@29.0.0-rc.4

  </details>

## 19.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/fuselage-ui-kit@29.0.0-rc.3
  - @rocket.chat/ui-avatar@25.0.0-rc.3
  - @rocket.chat/ui-client@29.0.0-rc.3
  - @rocket.chat/ui-contexts@29.0.0-rc.3

  </details>

## 19.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/fuselage-ui-kit@29.0.0-rc.2
  - @rocket.chat/ui-avatar@25.0.0-rc.2
  - @rocket.chat/ui-client@29.0.0-rc.2
  - @rocket.chat/ui-contexts@29.0.0-rc.2

  </details>

## 19.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/fuselage-ui-kit@29.0.0-rc.1
  - @rocket.chat/ui-avatar@25.0.0-rc.1
  - @rocket.chat/ui-client@29.0.0-rc.1
  - @rocket.chat/ui-contexts@29.0.0-rc.1

  </details>

## 19.0.0-rc.0

### Minor Changes

- ([#37922](https://github.com/RocketChat/Rocket.Chat/pull/37922)) Introduces native screen sharing for internal voice calls. This feature is currently in beta and can be disabled through admin settings.

### Patch Changes

- ([#39670](https://github.com/RocketChat/Rocket.Chat/pull/39670)) Fixes mismatched translations for Voice calling UI

- ([#38989](https://github.com/RocketChat/Rocket.Chat/pull/38989)) chore(eslint): Upgrades ESLint and its configuration

- <details><summary>Updated dependencies [87f9262af4a543d52642a54e1ef546d509a79e23, 539659af22bc19880eda047dfc0b152472ccb65c, 1741a20dd86c353755becfc706cd9ad63df09cfa, 43d0cfc6a70e8a31d5f3d24162216dae6b07efdd]:</summary>
  - @rocket.chat/fuselage-ui-kit@29.0.0-rc.0
  - @rocket.chat/media-signaling@0.2.0-rc.0
  - @rocket.chat/desktop-api@1.1.1-rc.0
  - @rocket.chat/ui-contexts@29.0.0-rc.0
  - @rocket.chat/ui-avatar@25.0.0-rc.0
  - @rocket.chat/ui-client@29.0.0-rc.0

  </details>

## 18.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/fuselage-ui-kit@28.0.1
  - @rocket.chat/ui-avatar@24.0.1
  - @rocket.chat/ui-client@28.0.1
  - @rocket.chat/ui-contexts@28.0.1

  </details>

## 18.0.0

### Patch Changes

- ([#38417](https://github.com/RocketChat/Rocket.Chat/pull/38417)) Fixes select not closing when dragging the new call widget

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/fuselage-ui-kit@28.0.0
  - @rocket.chat/ui-avatar@24.0.0
  - @rocket.chat/ui-client@28.0.0
  - @rocket.chat/ui-contexts@28.0.0

  </details>

## 18.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/fuselage-ui-kit@28.0.0-rc.2
  - @rocket.chat/ui-avatar@24.0.0-rc.2
  - @rocket.chat/ui-client@28.0.0-rc.2
  - @rocket.chat/ui-contexts@28.0.0-rc.2

  </details>

## 18.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/fuselage-ui-kit@28.0.0-rc.1
  - @rocket.chat/ui-avatar@24.0.0-rc.1
  - @rocket.chat/ui-client@28.0.0-rc.1
  - @rocket.chat/ui-contexts@28.0.0-rc.1

  </details>

## 18.0.0-rc.0

### Patch Changes

- ([#38417](https://github.com/RocketChat/Rocket.Chat/pull/38417)) Fixes select not closing when dragging the new call widget

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/fuselage-ui-kit@28.0.0-rc.0
  - @rocket.chat/ui-avatar@24.0.0-rc.0
  - @rocket.chat/ui-client@28.0.0-rc.0
  - @rocket.chat/ui-contexts@28.0.0-rc.0

  </details>

## 17.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/fuselage-ui-kit@27.0.1
  - @rocket.chat/ui-avatar@23.0.1
  - @rocket.chat/ui-client@27.0.1
  - @rocket.chat/ui-contexts@27.0.1

  </details>

## 17.0.0

### Minor Changes

- ([#37616](https://github.com/RocketChat/Rocket.Chat/pull/37616)) Introduces realtime user presence updates for the selected user when starting/transferring a voice call.

### Patch Changes

- ([#38169](https://github.com/RocketChat/Rocket.Chat/pull/38169)) Introduces in the call widget a quick link that redirects to the participant's direct message

- <details><summary>Updated dependencies [00b36c5a59fb45573f72c5409735238a817ff5ca, 719b85aa769fed231d0455bdd60f28867ceecfbe]:</summary>
  - @rocket.chat/ui-client@27.0.0
  - @rocket.chat/ui-contexts@27.0.0
  - @rocket.chat/fuselage-ui-kit@27.0.0
  - @rocket.chat/ui-avatar@23.0.0

  </details>

## 17.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/fuselage-ui-kit@27.0.0-rc.2
  - @rocket.chat/ui-avatar@23.0.0-rc.2
  - @rocket.chat/ui-client@27.0.0-rc.2
  - @rocket.chat/ui-contexts@27.0.0-rc.2

  </details>

## 17.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
- @rocket.chat/ui-contexts@27.0.0-rc.1
  - @rocket.chat/ui-client@27.0.0-rc.1
  - @rocket.chat/fuselage-ui-kit@27.0.0-rc.1
  - @rocket.chat/ui-avatar@23.0.0-rc.1
  </details>

## 17.0.0-rc.0

### Minor Changes

- ([#37616](https://github.com/RocketChat/Rocket.Chat/pull/37616)) Introduces realtime user presence updates for the selected user when starting/transferring a voice call.

### Patch Changes

- ([#38169](https://github.com/RocketChat/Rocket.Chat/pull/38169)) Introduces in the call widget a quick link that redirects to the participant's direct message

- <details><summary>Updated dependencies [00b36c5a59fb45573f72c5409735238a817ff5ca, 719b85aa769fed231d0455bdd60f28867ceecfbe]:</summary>
  - @rocket.chat/ui-client@27.0.0-rc.0
  - @rocket.chat/ui-contexts@27.0.0-rc.0
  - @rocket.chat/fuselage-ui-kit@27.0.0-rc.0
  - @rocket.chat/ui-avatar@23.0.0-rc.0

  </details>

## 16.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
- @rocket.chat/fuselage-ui-kit@26.0.1

  - @rocket.chat/ui-avatar@22.0.1
  - @rocket.chat/ui-client@26.0.1
  - @rocket.chat/ui-contexts@26.0.1

  </details>

## 16.0.0

### Major Changes

- ([#37672](https://github.com/RocketChat/Rocket.Chat/pull/37672)) Removes deprecated VoIP from Omnichannel

### Minor Changes

- ([#37771](https://github.com/RocketChat/Rocket.Chat/pull/37771)) Introduces an info button to voice call's in-chat history message, which opens a contextual bar with more detailed information about the voice call.

### Patch Changes

- <details><summary>Updated dependencies [ac11ea05ffadeca978c794ff38d5199d9acb2c29, 0c0258604632342f42fc36cabac2d6cfe0e477c4, bd5edfc2993c93bd77f42dcd30d38b57eeb50481, 94b87d9ef40647d77fe83f3f84dca46a94515b39, 733c94b996204151f580de2dd7f3402124b70977, d3538e7045c41f91b8c561d44e5485ff93b93745, 611e4cdfa04849416a58071646b853b95e9b817b, ae1e2faaeb6f7a086f8affde4c8a81e55e2a0e04, 55dc368f3f679e93bffb9f04efe3944832cf3336]:</summary>
  - @rocket.chat/ui-contexts@26.0.0
  - @rocket.chat/ui-client@26.0.0
  - @rocket.chat/fuselage-ui-kit@26.0.0
  - @rocket.chat/media-signaling@0.1.1
  - @rocket.chat/ui-avatar@22.0.0

  </details>

## 16.0.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/fuselage-ui-kit@26.0.0-rc.5
  - @rocket.chat/ui-avatar@22.0.0-rc.5
  - @rocket.chat/ui-client@26.0.0-rc.5
  - @rocket.chat/ui-contexts@26.0.0-rc.5

  </details>

## 16.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/fuselage-ui-kit@26.0.0-rc.4
  - @rocket.chat/ui-avatar@22.0.0-rc.4
  - @rocket.chat/ui-client@26.0.0-rc.4
  - @rocket.chat/ui-contexts@26.0.0-rc.4

  </details>

## 16.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies [ae1e2faaeb6f7a086f8affde4c8a81e55e2a0e04]:</summary>
  - @rocket.chat/media-signaling@0.1.1-rc.1
  - @rocket.chat/ui-contexts@26.0.0-rc.3
  - @rocket.chat/fuselage-ui-kit@26.0.0-rc.3
  - @rocket.chat/ui-avatar@22.0.0-rc.3
  - @rocket.chat/ui-client@26.0.0-rc.3

  </details>

## 16.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/fuselage-ui-kit@26.0.0-rc.2
  - @rocket.chat/ui-avatar@22.0.0-rc.2
  - @rocket.chat/ui-client@26.0.0-rc.2
  - @rocket.chat/ui-contexts@26.0.0-rc.2

  </details>

## 16.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/fuselage-ui-kit@26.0.0-rc.1
  - @rocket.chat/ui-avatar@22.0.0-rc.1
  - @rocket.chat/ui-client@26.0.0-rc.1
  - @rocket.chat/ui-contexts@26.0.0-rc.1

  </details>

## 16.0.0-rc.0

### Major Changes

- ([#37672](https://github.com/RocketChat/Rocket.Chat/pull/37672)) Removes deprecated VoIP from Omnichannel

### Minor Changes

- ([#37771](https://github.com/RocketChat/Rocket.Chat/pull/37771)) Introduces an info button to voice call's in-chat history message, which opens a contextual bar with more detailed information about the voice call.

### Patch Changes

- <details><summary>Updated dependencies [ac11ea05ffadeca978c794ff38d5199d9acb2c29, 0c0258604632342f42fc36cabac2d6cfe0e477c4, bd5edfc2993c93bd77f42dcd30d38b57eeb50481, 94b87d9ef40647d77fe83f3f84dca46a94515b39, 733c94b996204151f580de2dd7f3402124b70977, d3538e7045c41f91b8c561d44e5485ff93b93745, 611e4cdfa04849416a58071646b853b95e9b817b, 55dc368f3f679e93bffb9f04efe3944832cf3336]:</summary>
  - @rocket.chat/ui-contexts@26.0.0-rc.0
  - @rocket.chat/ui-client@26.0.0-rc.0
  - @rocket.chat/fuselage-ui-kit@26.0.0-rc.0
  - @rocket.chat/media-signaling@0.1.1-rc.0
  - @rocket.chat/ui-avatar@22.0.0-rc.0

  </details>

## 15.0.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@21.0.2
  - @rocket.chat/ui-client@25.0.2
  - @rocket.chat/ui-contexts@25.0.2

  </details>

## 15.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@21.0.1
  - @rocket.chat/ui-client@25.0.1
  - @rocket.chat/ui-contexts@25.0.1

  </details>

## 15.0.0

### Minor Changes

- ([#37217](https://github.com/RocketChat/Rocket.Chat/pull/37217)) Introduces a presence indicator in the call widget and transfer modal (status bullet).

- ([#37492](https://github.com/RocketChat/Rocket.Chat/pull/37492)) Introduces native desktop notifications for voice calls when using the desktop app.

- ([#37505](https://github.com/RocketChat/Rocket.Chat/pull/37505)) Introduces a new user preference to enable/disable desktop voice call notifications.

- ([#37469](https://github.com/RocketChat/Rocket.Chat/pull/37469)) Introduces visualization of the peer's muted and held state inside the Media Call widget

### Patch Changes

- ([#37320](https://github.com/RocketChat/Rocket.Chat/pull/37320)) Fixes an issue in the voice call peer selection field (on the widget and transfer modal) by filtering out the current peer and users that do not have an extension assigned, in case of forced SIP routing.

- <details><summary>Updated dependencies [31ab78f0d4648b2ba99513ffce737d52ee34fe7f, 150efb9d3c1a72a16bb9fe5fc4fc97fc441172d0, 99255057f27b9d854a89da815681a03d0776f846, fcb2d1f806c7f2f5c728ed2542cd1a73231a77fd]:</summary>
  - @rocket.chat/ui-client@25.0.0
  - @rocket.chat/ui-contexts@25.0.0
  - @rocket.chat/media-signaling@0.1.0
  - @rocket.chat/ui-avatar@21.0.0

  </details>

## 15.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@21.0.0-rc.2
  - @rocket.chat/ui-client@25.0.0-rc.2
  - @rocket.chat/ui-contexts@25.0.0-rc.2

  </details>

## 15.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@21.0.0-rc.1
  - @rocket.chat/ui-client@25.0.0-rc.1
  - @rocket.chat/ui-contexts@25.0.0-rc.1

  </details>

## 15.0.0-rc.0

### Minor Changes

- ([#37217](https://github.com/RocketChat/Rocket.Chat/pull/37217)) Introduces a presence indicator in the call widget and transfer modal (status bullet).

- ([#37492](https://github.com/RocketChat/Rocket.Chat/pull/37492)) Introduces native desktop notifications for voice calls when using the desktop app.

- ([#37505](https://github.com/RocketChat/Rocket.Chat/pull/37505)) Introduces a new user preference to enable/disable desktop voice call notifications.

- ([#37469](https://github.com/RocketChat/Rocket.Chat/pull/37469)) Introduces visualization of the peer's muted and held state inside the Media Call widget

### Patch Changes

- ([#37320](https://github.com/RocketChat/Rocket.Chat/pull/37320)) Fixes an issue in the voice call peer selection field (on the widget and transfer modal) by filtering out the current peer and users that do not have an extension assigned, in case of forced SIP routing.

- <details><summary>Updated dependencies [31ab78f0d4648b2ba99513ffce737d52ee34fe7f, 150efb9d3c1a72a16bb9fe5fc4fc97fc441172d0, 99255057f27b9d854a89da815681a03d0776f846, fcb2d1f806c7f2f5c728ed2542cd1a73231a77fd]:</summary>
  - @rocket.chat/ui-client@25.0.0-rc.0
  - @rocket.chat/ui-contexts@25.0.0-rc.0
  - @rocket.chat/media-signaling@0.1.0-rc.0
  - @rocket.chat/ui-avatar@21.0.0-rc.0

  </details>

  ## 14.0.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@20.0.2
  - @rocket.chat/ui-client@24.0.2
  - @rocket.chat/ui-contexts@24.0.2
  </details>

## 14.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@20.0.1
  - @rocket.chat/ui-client@24.0.1
  - @rocket.chat/ui-contexts@24.0.1

  </details>

## 14.0.0

### Minor Changes

- ([#37207](https://github.com/RocketChat/Rocket.Chat/pull/37207)) Adds call transfer requester information on call widget

- ([#37074](https://github.com/RocketChat/Rocket.Chat/pull/37074)) Introduces audio feedback for the Voice Call Dialpad.

### Patch Changes

- <details><summary>Updated dependencies [085d6536d23fe5cc293fec2f1454eb7442e8c7f4, a25e88c06cafdbe3baf7a40e3bffe3aed5a81cf6]:</summary>
  - @rocket.chat/ui-client@24.0.0
  - @rocket.chat/ui-contexts@24.0.0
  - @rocket.chat/ui-avatar@20.0.0

  </details>

## 14.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@20.0.0-rc.4
  - @rocket.chat/ui-client@24.0.0-rc.4
  - @rocket.chat/ui-contexts@24.0.0-rc.4

  </details>

## 14.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@20.0.0-rc.3
  - @rocket.chat/ui-client@24.0.0-rc.3
  - @rocket.chat/ui-contexts@24.0.0-rc.3

  </details>

## 14.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@20.0.0-rc.2
  - @rocket.chat/ui-client@24.0.0-rc.2
  - @rocket.chat/ui-contexts@24.0.0-rc.2

  </details>

## 14.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@20.0.0-rc.1
  - @rocket.chat/ui-client@24.0.0-rc.1
  - @rocket.chat/ui-contexts@24.0.0-rc.1

  </details>

## 14.0.0-rc.0

### Minor Changes

- ([#37207](https://github.com/RocketChat/Rocket.Chat/pull/37207)) Adds call transfer requester information on call widget

- ([#37074](https://github.com/RocketChat/Rocket.Chat/pull/37074)) Introduces audio feedback for the Voice Call Dialpad.

### Patch Changes

- <details><summary>Updated dependencies [085d6536d23fe5cc293fec2f1454eb7442e8c7f4, a25e88c06cafdbe3baf7a40e3bffe3aed5a81cf6]:</summary>
  - @rocket.chat/ui-client@24.0.0-rc.0
  - @rocket.chat/ui-contexts@24.0.0-rc.0
  - @rocket.chat/ui-avatar@20.0.0-rc.0

  </details>

## 13.0.0

### Minor Changes

- ([#36717](https://github.com/RocketChat/Rocket.Chat/pull/36717)) Introduces a new voice call architecture along with a new and improved call widget experience.

- ([#36397](https://github.com/RocketChat/Rocket.Chat/pull/36397)) Introduces a new flow for requesting device permissions for Voice Calling, prompting the user before the request. Also solves a few issues with the device selection menu.

### Patch Changes

- ([#36207](https://github.com/RocketChat/Rocket.Chat/pull/36207)) Introduces the Outbound Message feature to Omnichannel, allowing organizations to initiate proactive communication with contacts through their preferred messaging channel directly from Rocket.Chat

- <details><summary>Updated dependencies [feba290fc403de27efb6bb9a571bec43413e976a, b0a4602a4461200b9872b2b073ec56fa55ecb466, c6ef437d9071dbd8c08152984dc39542b1ae7306, 399ab0233c9cd5d7f25ce955b452feecdc378744]:</summary>
  - @rocket.chat/ui-contexts@23.0.0
  - @rocket.chat/ui-avatar@19.0.0
  - @rocket.chat/ui-client@23.0.0

  </details>

## 13.0.0-rc.7

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@19.0.0-rc.7
  - @rocket.chat/ui-client@23.0.0-rc.7
  - @rocket.chat/ui-contexts@23.0.0-rc.7

  </details>

## 13.0.0-rc.6

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@19.0.0-rc.6
  - @rocket.chat/ui-client@23.0.0-rc.6
  - @rocket.chat/ui-contexts@23.0.0-rc.6

  </details>

## 13.0.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@19.0.0-rc.5
  - @rocket.chat/ui-client@23.0.0-rc.5
  - @rocket.chat/ui-contexts@23.0.0-rc.5

  </details>

## 13.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@19.0.0-rc.4
  - @rocket.chat/ui-client@23.0.0-rc.4
  - @rocket.chat/ui-contexts@23.0.0-rc.4

  </details>

## 13.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@19.0.0-rc.3
  - @rocket.chat/ui-client@23.0.0-rc.3
  - @rocket.chat/ui-contexts@23.0.0-rc.3

  </details>

## 13.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@19.0.0-rc.2
  - @rocket.chat/ui-client@23.0.0-rc.2
  - @rocket.chat/ui-contexts@23.0.0-rc.2
  </details>

## 13.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@19.0.0-rc.1
  - @rocket.chat/ui-client@23.0.0-rc.1
  - @rocket.chat/ui-contexts@23.0.0-rc.1

  </details>

## 13.0.0-rc.0

### Minor Changes

- ([#36717](https://github.com/RocketChat/Rocket.Chat/pull/36717)) Introduces a new voice call architecture along with a new and improved call widget experience.

- ([#36397](https://github.com/RocketChat/Rocket.Chat/pull/36397)) Introduces a new flow for requesting device permissions for Voice Calling, prompting the user before the request. Also solves a few issues with the device selection menu.

### Patch Changes

- ([#36207](https://github.com/RocketChat/Rocket.Chat/pull/36207)) Introduces the Outbound Message feature to Omnichannel, allowing organizations to initiate proactive communication with contacts through their preferred messaging channel directly from Rocket.Chat

- <details><summary>Updated dependencies [feba290fc403de27efb6bb9a571bec43413e976a, b0a4602a4461200b9872b2b073ec56fa55ecb466, c6ef437d9071dbd8c08152984dc39542b1ae7306, 399ab0233c9cd5d7f25ce955b452feecdc378744]:</summary>
  - @rocket.chat/ui-contexts@23.0.0-rc.0
  - @rocket.chat/ui-avatar@19.0.0-rc.0
  - @rocket.chat/ui-client@23.0.0-rc.0

  </details>

## 12.0.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@18.0.2
  - @rocket.chat/ui-client@22.0.2
  - @rocket.chat/ui-contexts@22.0.2

  </details>

## 12.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@18.0.1
  - @rocket.chat/ui-client@22.0.1
  - @rocket.chat/ui-contexts@22.0.1
  </details>

## 12.0.0

### Patch Changes

- <details><summary>Updated dependencies [759b178946951f10dfcf0c9daf0f45aceb422998, a1c99dfe7bdee81e85164155e61b94b55dcbb752, c7db598e9f3c2ad47f6a6be2a9ba7078533c245b]:</summary>
  - @rocket.chat/ui-client@22.0.0
  - @rocket.chat/ui-contexts@22.0.0
  - @rocket.chat/ui-avatar@18.0.0

  </details>

## 12.0.0-rc.6

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@18.0.0-rc.6
  - @rocket.chat/ui-client@22.0.0-rc.6
  - @rocket.chat/ui-contexts@22.0.0-rc.6

  </details>

## 12.0.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@18.0.0-rc.5
  - @rocket.chat/ui-client@22.0.0-rc.5
  - @rocket.chat/ui-contexts@22.0.0-rc.5
  </details>

## 12.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@18.0.0-rc.4
  - @rocket.chat/ui-client@22.0.0-rc.4
  - @rocket.chat/ui-contexts@22.0.0-rc.4
  </details>

## 12.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@18.0.0-rc.3
  - @rocket.chat/ui-client@22.0.0-rc.3
  - @rocket.chat/ui-contexts@22.0.0-rc.3
  </details>

## 12.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@18.0.0-rc.2
  - @rocket.chat/ui-client@22.0.0-rc.2
  - @rocket.chat/ui-contexts@22.0.0-rc.2

  </details>

## 12.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@18.0.0-rc.1
  - @rocket.chat/ui-client@22.0.0-rc.1
  - @rocket.chat/ui-contexts@22.0.0-rc.1

  </details>

## 12.0.0-rc.0

### Patch Changes

- <details><summary>Updated dependencies [759b178946951f10dfcf0c9daf0f45aceb422998, a1c99dfe7bdee81e85164155e61b94b55dcbb752, c7db598e9f3c2ad47f6a6be2a9ba7078533c245b]:</summary>
  - @rocket.chat/ui-client@22.0.0-rc.0
  - @rocket.chat/ui-contexts@22.0.0-rc.0
  - @rocket.chat/ui-avatar@18.0.0-rc.0

  </details>

## 11.0.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@17.0.3
  - @rocket.chat/ui-client@21.0.3
  - @rocket.chat/ui-contexts@21.0.3
  </details>

## 11.0.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@17.0.2
  - @rocket.chat/ui-client@21.0.2
  - @rocket.chat/ui-contexts@21.0.2
  </details>

## 11.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
    - @rocket.chat/ui-avatar@17.0.1
    - @rocket.chat/ui-client@21.0.1
    - @rocket.chat/ui-contexts@21.0.1
  </details>

## 11.0.0

### Patch Changes

- ([#36229](https://github.com/RocketChat/Rocket.Chat/pull/36229)) Fixes VoIP widget mute action muting received audio instead of just microphone

- ([#35006](https://github.com/RocketChat/Rocket.Chat/pull/35006)) Fixes the parsing of FreeSwitch events to properly generate a history of calls on Rocket.Chat

- ([#36225](https://github.com/RocketChat/Rocket.Chat/pull/36225)) Fixes incoming VoIP calls playing "dial" sound when answered

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@21.0.0
  - @rocket.chat/ui-avatar@17.0.0
  - @rocket.chat/ui-client@21.0.0

  </details>

## 11.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@17.0.0-rc.2
  - @rocket.chat/ui-client@21.0.0-rc.2
  - @rocket.chat/ui-contexts@21.0.0-rc.2

  </details>

## 11.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@17.0.0-rc.1
  - @rocket.chat/ui-client@21.0.0-rc.1
  - @rocket.chat/ui-contexts@21.0.0-rc.1

  </details>

## 11.0.0-rc.0

### Patch Changes

- ([#36229](https://github.com/RocketChat/Rocket.Chat/pull/36229)) Fixes VoIP widget mute action muting received audio instead of just microphone

- ([#35006](https://github.com/RocketChat/Rocket.Chat/pull/35006)) Fixes the parsing of FreeSwitch events to properly generate a history of calls on Rocket.Chat

- ([#36225](https://github.com/RocketChat/Rocket.Chat/pull/36225)) Fixes incoming VoIP calls playing "dial" sound when answered

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@21.0.0-rc.0
  - @rocket.chat/ui-avatar@17.0.0-rc.0
  - @rocket.chat/ui-client@21.0.0-rc.0

  </details>

## 10.0.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@20.0.3
  - @rocket.chat/ui-avatar@16.0.3
  - @rocket.chat/ui-client@20.0.3
  </details>

## 10.0.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@20.0.2
  - @rocket.chat/ui-avatar@16.0.2
  - @rocket.chat/ui-client@20.0.2

  </details>

## 10.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@20.0.1
  - @rocket.chat/ui-avatar@16.0.1
  - @rocket.chat/ui-client@20.0.1

  </details>

## 10.0.0

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@20.0.0
  - @rocket.chat/ui-avatar@16.0.0
  - @rocket.chat/ui-client@20.0.0

  </details>

## 10.0.0-rc.9

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@20.0.0-rc.9
  - @rocket.chat/ui-avatar@16.0.0-rc.9
  - @rocket.chat/ui-client@20.0.0-rc.9

  </details>

## 10.0.0-rc.8

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@20.0.0-rc.8
  - @rocket.chat/ui-avatar@16.0.0-rc.8
  - @rocket.chat/ui-client@20.0.0-rc.8

  </details>

## 10.0.0-rc.7

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@20.0.0-rc.7
  - @rocket.chat/ui-avatar@16.0.0-rc.7
  - @rocket.chat/ui-client@20.0.0-rc.7

  </details>

## 10.0.0-rc.6

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@20.0.0-rc.6
  - @rocket.chat/ui-avatar@16.0.0-rc.6
  - @rocket.chat/ui-client@20.0.0-rc.6

  </details>

## 10.0.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@20.0.0-rc.5
  - @rocket.chat/ui-avatar@16.0.0-rc.5
  - @rocket.chat/ui-client@20.0.0-rc.5

  </details>

## 10.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@20.0.0-rc.4
  - @rocket.chat/ui-avatar@16.0.0-rc.4
  - @rocket.chat/ui-client@20.0.0-rc.4

  </details>

## 10.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@20.0.0-rc.3
  - @rocket.chat/ui-avatar@16.0.0-rc.3
  - @rocket.chat/ui-client@20.0.0-rc.3

  </details>

## 10.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@20.0.0-rc.2
  - @rocket.chat/ui-avatar@16.0.0-rc.2
  - @rocket.chat/ui-client@20.0.0-rc.2

  </details>

## 10.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>

## 10.0.0-rc.1

- @rocket.chat/ui-contexts@20.0.0-rc.1
- @rocket.chat/ui-avatar@16.0.0-rc.1
- @rocket.chat/ui-client@20.0.0-rc.1

</details>

## 10.0.0-rc.0

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@20.0.0-rc.0
  - @rocket.chat/ui-avatar@16.0.0-rc.0
  - @rocket.chat/ui-client@20.0.0-rc.0

  </details>

## 9.0.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@19.0.4
  - @rocket.chat/ui-avatar@15.0.4
  - @rocket.chat/ui-client@19.0.4
  </details>

## 9.0.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@19.0.3
  - @rocket.chat/ui-avatar@15.0.3
  - @rocket.chat/ui-client@19.0.3
  </details>

## 9.0.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@19.0.2
  - @rocket.chat/ui-avatar@15.0.2
  - @rocket.chat/ui-client@19.0.2

  </details>

## 9.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@19.0.1
  - @rocket.chat/ui-avatar@15.0.1
  - @rocket.chat/ui-client@19.0.1

  </details>

## 9.0.0

### Minor Changes

- ([#35830](https://github.com/RocketChat/Rocket.Chat/pull/35830)) Introduces a new feature which enables dragging the VoIP call widget to change its position on the screen.

- ([#35776](https://github.com/RocketChat/Rocket.Chat/pull/35776)) Improves handling of errors during voice calls

### Patch Changes

- <details><summary>Updated dependencies [aadc7956bdeb281007ef06f158088640a44171df]:</summary>
  - @rocket.chat/ui-client@19.0.0
  - @rocket.chat/ui-contexts@19.0.0
  - @rocket.chat/ui-avatar@15.0.0

  </details>

## 9.0.0-rc.6

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@19.0.0-rc.6
  - @rocket.chat/ui-avatar@15.0.0-rc.6
  - @rocket.chat/ui-client@19.0.0-rc.6

  </details>

## 9.0.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@19.0.0-rc.5
  - @rocket.chat/ui-avatar@15.0.0-rc.5
  - @rocket.chat/ui-client@19.0.0-rc.5

  </details>

## 9.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@19.0.0-rc.4
  - @rocket.chat/ui-avatar@15.0.0-rc.4
  - @rocket.chat/ui-client@19.0.0-rc.4

  </details>

## 9.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@19.0.0-rc.3
  - @rocket.chat/ui-avatar@15.0.0-rc.3
  - @rocket.chat/ui-client@19.0.0-rc.3

  </details>

## 9.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@19.0.0-rc.2
  - @rocket.chat/ui-avatar@15.0.0-rc.2
  - @rocket.chat/ui-client@19.0.0-rc.2

  </details>

## 9.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@19.0.0-rc.1
  - @rocket.chat/ui-avatar@15.0.0-rc.1
  - @rocket.chat/ui-client@19.0.0-rc.1

  </details>

## 9.0.0-rc.0

### Minor Changes

- ([#35830](https://github.com/RocketChat/Rocket.Chat/pull/35830)) Introduces a new feature which enables dragging the VoIP call widget to change its position on the screen.

- ([#35776](https://github.com/RocketChat/Rocket.Chat/pull/35776)) Improves handling of errors during voice calls

### Patch Changes

- <details><summary>Updated dependencies [aadc7956bdeb281007ef06f158088640a44171df]:</summary>
  - @rocket.chat/ui-client@19.0.0-rc.0
  - @rocket.chat/ui-contexts@19.0.0-rc.0
  - @rocket.chat/ui-avatar@15.0.0-rc.0

  </details>

## 8.0.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@18.0.2
  - @rocket.chat/ui-avatar@14.0.2
  - @rocket.chat/ui-client@18.0.2

  </details>

## 8.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@18.0.1
  - @rocket.chat/ui-avatar@14.0.1
  - @rocket.chat/ui-client@18.0.1

  </details>

## 8.0.0

### Minor Changes

- ([#35721](https://github.com/RocketChat/Rocket.Chat/pull/35721)) Enhances the `/api/apps/installed` and `/api/apps/:id/status` endpoints so they get apps' status across the cluster in High-Availability and Microservices deployments

### Patch Changes

- ([#35765](https://github.com/RocketChat/Rocket.Chat/pull/35765)) Fixes an issue causing VoIP calls to no longer reach the client after a temporary disconnection

- ([#35832](https://github.com/RocketChat/Rocket.Chat/pull/35832)) Fixes an issue where Voice Calls were unable to gather Ice Servers

- <details><summary>Updated dependencies [f545617c2ac3d67af533e64c2670d8d564a56d15, 6bf386dcc2a560963cf719fbc2d96569ce23a2de, 1eeb139158fcd621a2b8d3a7de5bb512e659261d, d8eb824d242cbbeafb11b1c4a806860e4541ba79, 5e3ab1a07163cd22ad4c41502ef232845d26bdc2, 72725d391e79b44e7380ee2fe640e2e4426c77ca, 4690c55d8e379d0bd5dfa444f3e0a4175e88d8de]:</summary>
  - @rocket.chat/ui-client@18.0.0
  - @rocket.chat/ui-contexts@18.0.0
  - @rocket.chat/ui-avatar@14.0.0

  </details>

## 8.0.0-rc.8

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@18.0.0-rc.8
  - @rocket.chat/ui-avatar@14.0.0-rc.8
  - @rocket.chat/ui-client@18.0.0-rc.8

  </details>

## 8.0.0-rc.7

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@18.0.0-rc.7
  - @rocket.chat/ui-avatar@14.0.0-rc.7
  - @rocket.chat/ui-client@18.0.0-rc.7

  </details>

## 8.0.0-rc.6

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@18.0.0-rc.6
  - @rocket.chat/ui-avatar@14.0.0-rc.6
  - @rocket.chat/ui-client@18.0.0-rc.6

  </details>

## 8.0.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@18.0.0-rc.5
  - @rocket.chat/ui-avatar@14.0.0-rc.5
  - @rocket.chat/ui-client@18.0.0-rc.5

  </details>

## 8.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@18.0.0-rc.4
  - @rocket.chat/ui-avatar@14.0.0-rc.4
  - @rocket.chat/ui-client@18.0.0-rc.4

  </details>

## 8.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@18.0.0-rc.3
  - @rocket.chat/ui-avatar@14.0.0-rc.3
  - @rocket.chat/ui-client@18.0.0-rc.3

  </details>

## 8.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@18.0.0-rc.2
  - @rocket.chat/ui-avatar@14.0.0-rc.2
  - @rocket.chat/ui-client@18.0.0-rc.2

  </details>

## 8.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@18.0.0-rc.1
  - @rocket.chat/ui-avatar@14.0.0-rc.1
  - @rocket.chat/ui-client@18.0.0-rc.1

  </details>

## 8.0.0-rc.0

### Minor Changes

- ([#35721](https://github.com/RocketChat/Rocket.Chat/pull/35721)) Enhances the `/api/apps/installed` and `/api/apps/:id/status` endpoints so they get apps' status across the cluster in High-Availability and Microservices deployments

### Patch Changes

- ([#35765](https://github.com/RocketChat/Rocket.Chat/pull/35765)) Fixes an issue causing VoIP calls to no longer reach the client after a temporary disconnection

- ([#35832](https://github.com/RocketChat/Rocket.Chat/pull/35832)) Fixes an issue where Voice Calls were unable to gather Ice Servers

- <details><summary>Updated dependencies [f545617c2ac3d67af533e64c2670d8d564a56d15, 6bf386dcc2a560963cf719fbc2d96569ce23a2de, 1eeb139158fcd621a2b8d3a7de5bb512e659261d, d8eb824d242cbbeafb11b1c4a806860e4541ba79, 5e3ab1a07163cd22ad4c41502ef232845d26bdc2, 72725d391e79b44e7380ee2fe640e2e4426c77ca, 4690c55d8e379d0bd5dfa444f3e0a4175e88d8de]:</summary>
  - @rocket.chat/ui-client@18.0.0-rc.0
  - @rocket.chat/ui-contexts@18.0.0-rc.0
  - @rocket.chat/ui-avatar@14.0.0-rc.0

  </details>

## 7.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@17.0.1
  - @rocket.chat/ui-avatar@13.0.1
  - @rocket.chat/ui-client@17.0.1

  </details>

## 7.0.0

### Patch Changes

- ([#35286](https://github.com/RocketChat/Rocket.Chat/pull/35286)) Bumps fuselage and related packages versions to use the most recent releases of each package, especially the fix for the missing track of the fuselage slider component

- ([#35420](https://github.com/RocketChat/Rocket.Chat/pull/35420)) fixes an issue where audio from VoIP calls would sometimes not be played

- <details><summary>Updated dependencies [c7b21f1c1e479533a208771f3e15f064f2c7e3ff]:</summary>
  - @rocket.chat/ui-avatar@13.0.0
  - @rocket.chat/ui-client@17.0.0
  - @rocket.chat/ui-contexts@17.0.0

  </details>

## 7.0.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@17.0.0-rc.5
  - @rocket.chat/ui-avatar@13.0.0-rc.5
  - @rocket.chat/ui-client@17.0.0-rc.5

  </details>

## 7.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@17.0.0-rc.4
  - @rocket.chat/ui-avatar@13.0.0-rc.4
  - @rocket.chat/ui-client@17.0.0-rc.4

  </details>

## 7.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@17.0.0-rc.3
  - @rocket.chat/ui-avatar@13.0.0-rc.3
  - @rocket.chat/ui-client@17.0.0-rc.3

  </details>

## 7.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@17.0.0-rc.2
  - @rocket.chat/ui-avatar@13.0.0-rc.2
  - @rocket.chat/ui-client@17.0.0-rc.2

  </details>

## 7.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@17.0.0-rc.1
  - @rocket.chat/ui-avatar@13.0.0-rc.1
  - @rocket.chat/ui-client@17.0.0-rc.1

  </details>

## 7.0.0-rc.0

### Patch Changes

- ([#35286](https://github.com/RocketChat/Rocket.Chat/pull/35286)) Bumps fuselage and related packages versions to use the most recent releases of each package, especially the fix for the missing track of the fuselage slider component

- ([#35420](https://github.com/RocketChat/Rocket.Chat/pull/35420)) fixes an issue where audio from VoIP calls would sometimes not be played

- <details><summary>Updated dependencies [c7b21f1c1e479533a208771f3e15f064f2c7e3ff]:</summary>
  - @rocket.chat/ui-avatar@13.0.0-rc.0
  - @rocket.chat/ui-client@17.0.0-rc.0
  - @rocket.chat/ui-contexts@17.0.0-rc.0

  </details>

## 6.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@16.0.1
  - @rocket.chat/ui-avatar@12.0.1
  - @rocket.chat/ui-client@16.0.1

  </details>

## 6.0.0

### Patch Changes

- ([#34926](https://github.com/RocketChat/Rocket.Chat/pull/34926)) Enables control of video conference ringing and dialing sounds through the call ringer volume user preference, preventing video conf calls from always playing at maximum volume.

- <details><summary>Updated dependencies [89964144e042c8d9282b51efd89e1e684077fdd7]:</summary>
  - @rocket.chat/ui-client@16.0.0
  - @rocket.chat/ui-contexts@16.0.0
  - @rocket.chat/ui-avatar@12.0.0

  </details>

## 6.0.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@16.0.0-rc.5
  - @rocket.chat/ui-avatar@12.0.0-rc.5
  - @rocket.chat/ui-client@16.0.0-rc.5

  </details>

## 6.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@16.0.0-rc.4
  - @rocket.chat/ui-avatar@12.0.0-rc.4
  - @rocket.chat/ui-client@16.0.0-rc.4

  </details>

## 6.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@16.0.0-rc.3
  - @rocket.chat/ui-avatar@12.0.0-rc.3
  - @rocket.chat/ui-client@16.0.0-rc.3
  </details>

## 6.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@16.0.0-rc.2
  - @rocket.chat/ui-avatar@12.0.0-rc.2
  - @rocket.chat/ui-client@16.0.0-rc.2

  </details>

## 6.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@16.0.0-rc.1
  - @rocket.chat/ui-avatar@12.0.0-rc.1
  - @rocket.chat/ui-client@16.0.0-rc.1

  </details>

## 6.0.0-rc.0

### Patch Changes

- ([#34926](https://github.com/RocketChat/Rocket.Chat/pull/34926)) Enables control of video conference ringing and dialing sounds through the call ringer volume user preference, preventing video conf calls from always playing at maximum volume.

- <details><summary>Updated dependencies [89964144e042c8d9282b51efd89e1e684077fdd7]:</summary>
  - @rocket.chat/ui-client@16.0.0-rc.0
  - @rocket.chat/ui-contexts@16.0.0-rc.0
  - @rocket.chat/ui-avatar@12.0.0-rc.0

  </details>

## 5.0.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@15.0.3
  - @rocket.chat/ui-avatar@11.0.3
  - @rocket.chat/ui-client@15.0.3

  </details>

## 5.0.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@15.0.2
  - @rocket.chat/ui-avatar@11.0.2
  - @rocket.chat/ui-client@15.0.2

  </details>

## 5.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@15.0.1
  - @rocket.chat/ui-avatar@11.0.1
  - @rocket.chat/ui-client@15.0.1

  </details>

## 5.0.0

### Patch Changes

- <details><summary>Updated dependencies [5506c406f4a22145ece065ad2b797225e94423ca]:</summary>
  - @rocket.chat/ui-contexts@15.0.0
  - @rocket.chat/ui-client@15.0.0
  - @rocket.chat/ui-avatar@11.0.0

  </details>

## 5.0.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@15.0.0-rc.5
  - @rocket.chat/ui-avatar@11.0.0-rc.5
  - @rocket.chat/ui-client@15.0.0-rc.5

  </details>

## 5.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@15.0.0-rc.4
  - @rocket.chat/ui-avatar@11.0.0-rc.4
  - @rocket.chat/ui-client@15.0.0-rc.4

  </details>

## 5.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@15.0.0-rc.3
  - @rocket.chat/ui-avatar@11.0.0-rc.3
  - @rocket.chat/ui-client@15.0.0-rc.3

  </details>

## 5.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@15.0.0-rc.2
  - @rocket.chat/ui-avatar@11.0.0-rc.2
  - @rocket.chat/ui-client@15.0.0-rc.2

  </details>

## 5.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@15.0.0-rc.1
  - @rocket.chat/ui-avatar@11.0.0-rc.1
  - @rocket.chat/ui-client@15.0.0-rc.1

  </details>

## 5.0.0-rc.0

### Patch Changes

- <details><summary>Updated dependencies [5506c406f4a22145ece065ad2b797225e94423ca]:</summary>
  - @rocket.chat/ui-contexts@15.0.0-rc.0
  - @rocket.chat/ui-client@15.0.0-rc.0
  - @rocket.chat/ui-avatar@11.0.0-rc.0

  </details>

## 4.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@14.0.1
  - @rocket.chat/ui-avatar@10.0.1
  - @rocket.chat/ui-client@14.0.1

  </details>

## 4.0.0

### Patch Changes

- ([#34205](https://github.com/RocketChat/Rocket.Chat/pull/34205)) Fixes an error where the engine would not retry a subprocess restart if the last attempt failed

- ([#34205](https://github.com/RocketChat/Rocket.Chat/pull/34205)) Fixes error propagation when trying to get the status of apps in some cases

- ([#34102](https://github.com/RocketChat/Rocket.Chat/pull/34102)) Fixes an issue preventing VoIP permission updates from being properly reflected in the UI.

- ([#34205](https://github.com/RocketChat/Rocket.Chat/pull/34205)) Fixes wrong data being reported to total failed apps metrics and statistics

- <details><summary>Updated dependencies [76f6239ff1a9f34f163c03c140c4ceba62563b4e, c43220dcd8c1df86a6143d6553964ad2173903b3, 76f6239ff1a9f34f163c03c140c4ceba62563b4e, 76f6239ff1a9f34f163c03c140c4ceba62563b4e, be2ede48ba7774a43189a729b385f441d088b68e]:</summary>
  - @rocket.chat/ui-contexts@14.0.0
  - @rocket.chat/ui-avatar@10.0.0
  - @rocket.chat/ui-client@14.0.0

  </details>

## 4.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@14.0.0-rc.3
  - @rocket.chat/ui-avatar@10.0.0-rc.3
  - @rocket.chat/ui-client@14.0.0-rc.3

  </details>

## 4.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies [c43220dcd8c1df86a6143d6553964ad2173903b3]:</summary>
  - @rocket.chat/ui-contexts@14.0.0-rc.2
  - @rocket.chat/ui-client@14.0.0-rc.2
  - @rocket.chat/ui-avatar@10.0.0-rc.2

  </details>

## 4.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@14.0.0-rc.1
  - @rocket.chat/ui-avatar@10.0.0-rc.1
  - @rocket.chat/ui-client@14.0.0-rc.1

  </details>

## 4.0.0-rc.0

### Patch Changes

- ([#34205](https://github.com/RocketChat/Rocket.Chat/pull/34205)) Fixes an error where the engine would not retry a subprocess restart if the last attempt failed

- ([#34205](https://github.com/RocketChat/Rocket.Chat/pull/34205)) Fixes error propagation when trying to get the status of apps in some cases

- ([#34102](https://github.com/RocketChat/Rocket.Chat/pull/34102)) Fixes an issue preventing VoIP permission updates from being properly reflected in the UI.

- ([#34205](https://github.com/RocketChat/Rocket.Chat/pull/34205)) Fixes wrong data being reported to total failed apps metrics and statistics

- <details><summary>Updated dependencies [76f6239ff1a9f34f163c03c140c4ceba62563b4e, 76f6239ff1a9f34f163c03c140c4ceba62563b4e, 76f6239ff1a9f34f163c03c140c4ceba62563b4e, be2ede48ba7774a43189a729b385f441d088b68e]:</summary>
  - @rocket.chat/ui-contexts@14.0.0-rc.0
  - @rocket.chat/ui-avatar@10.0.0-rc.0
  - @rocket.chat/ui-client@14.0.0-rc.0

  </details>

## 3.0.0

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@13.0.0
  - @rocket.chat/ui-avatar@9.0.0
  - @rocket.chat/ui-client@13.0.0

  </details>

## 3.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@13.0.0-rc.3
  - @rocket.chat/ui-avatar@9.0.0-rc.3
  - @rocket.chat/ui-client@13.0.0-rc.3

  </details>

## 3.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@13.0.0-rc.2
  - @rocket.chat/ui-avatar@9.0.0-rc.2
  - @rocket.chat/ui-client@13.0.0-rc.2

  </details>

## 3.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@13.0.0-rc.1
  - @rocket.chat/ui-avatar@9.0.0-rc.1
  - @rocket.chat/ui-client@13.0.0-rc.1

  </details>

## 3.0.0-rc.0

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@13.0.0-rc.0
  - @rocket.chat/ui-avatar@9.0.0-rc.0
  - @rocket.chat/ui-client@13.0.0-rc.0

  </details>

## 2.0.0

### Minor Changes

- ([#33592](https://github.com/RocketChat/Rocket.Chat/pull/33592)) Adds ability to collapse/expand sidebar groups

### Patch Changes

- ([#33346](https://github.com/RocketChat/Rocket.Chat/pull/33346)) Implements integration with FreeSwitch to enable VoIP calls for team collaboration workspaces

- <details><summary>Updated dependencies [bcacbb1cee, 9274cf4586, 760ae5c01a]:</summary>
  - @rocket.chat/ui-client@12.0.0
  - @rocket.chat/ui-avatar@8.0.0
  - @rocket.chat/ui-contexts@12.0.0

  </details>

## 2.0.0-rc.6

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@12.0.0-rc.6
  - @rocket.chat/ui-avatar@8.0.0-rc.6
  - @rocket.chat/ui-client@12.0.0-rc.6

  </details>

## 2.0.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@12.0.0-rc.5
  - @rocket.chat/ui-avatar@8.0.0-rc.5
  - @rocket.chat/ui-client@12.0.0-rc.5

  </details>

## 2.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@12.0.0-rc.4
  - @rocket.chat/ui-avatar@8.0.0-rc.4
  - @rocket.chat/ui-client@12.0.0-rc.4

  </details>

## 2.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@12.0.0-rc.3
  - @rocket.chat/ui-avatar@8.0.0-rc.3
  - @rocket.chat/ui-client@12.0.0-rc.3

  </details>

## 2.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@12.0.0-rc.2
  - @rocket.chat/ui-avatar@8.0.0-rc.2
  - @rocket.chat/ui-client@12.0.0-rc.2

  </details>

## 2.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@12.0.0-rc.1
  - @rocket.chat/ui-avatar@8.0.0-rc.1
  - @rocket.chat/ui-client@12.0.0-rc.1

  </details>

## 2.0.0-rc.0

### Minor Changes

- ([#33592](https://github.com/RocketChat/Rocket.Chat/pull/33592)) Adds ability to collapse/expand sidebar groups

### Patch Changes

- ([#33346](https://github.com/RocketChat/Rocket.Chat/pull/33346)) Implements integration with FreeSwitch to enable VoIP calls for team collaboration workspaces

- <details><summary>Updated dependencies [bcacbb1cee, 9274cf4586, 760ae5c01a]:</summary>
  - @rocket.chat/ui-client@12.0.0-rc.0
  - @rocket.chat/ui-avatar@8.0.0-rc.0
  - @rocket.chat/ui-contexts@12.0.0-rc.0

  </details>
