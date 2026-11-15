# Change Log

## 36.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies [5f3c7c2426a29a0f8237a1ec0d72192b2ef1f0a4]:</summary>
  - @rocket.chat/ui-avatar@32.0.0-rc.1
  - @rocket.chat/fuselage@1.0.0-rc.1
  - @rocket.chat/gazzodown@36.0.0-rc.1
  - @rocket.chat/ui-video-conf@36.0.0-rc.1
  - @rocket.chat/core-typings@9.0.0-rc.3

  </details>

## 36.0.0-rc.0

### Minor Changes

- ([#42818](https://github.com/RocketChat/Rocket.Chat/pull/42818)) Renders autocompletes, UiKit selects, room members, banned users, team channels and call member lists with the `Item` rows, and names the icons of user and room options for assistive technology

- ([#42562](https://github.com/RocketChat/Rocket.Chat/pull/42562)) Adds `accessibility_label` to UiKit buttons: screen readers announce it instead of the button text, for buttons whose visible text is ambiguous on its own.

- ([#42854](https://github.com/RocketChat/Rocket.Chat/pull/42854)) Adds the UiKit `context_actions` block: a compact row of icon buttons attached to the end of a message, for actions about it.

- ([#42562](https://github.com/RocketChat/Rocket.Chat/pull/42562)) Adds `filter.include` and `default_to_current_conversation` to the UiKit conversations selects: apps can list only public channels, private groups or direct messages, and start with the room the view was opened from already selected.

- ([#42562](https://github.com/RocketChat/Rocket.Chat/pull/42562)) Adds rendering for the UiKit `conversations_select` and `multi_conversations_select` elements. They list the conversations the user belongs to (channels, private groups and direct messages), and their value is the room id or the list of room ids. Both elements now also accept a `placeholder`.

- ([#42562](https://github.com/RocketChat/Rocket.Chat/pull/42562)) Adds the UiKit `datetimepicker` element, which picks a date and a time together in `actions` and `input` blocks. Its `initial_date_time` and value are Unix timestamps in seconds, shown in the user's time zone.

- ([#42854](https://github.com/RocketChat/Rocket.Chat/pull/42854)) Adds the UiKit `feedback_buttons` element to `context_actions`: a thumbs up and a thumbs down button that send the chosen value to the app, to rate a message such as an answer.

- ([#42562](https://github.com/RocketChat/Rocket.Chat/pull/42562)) Adds `focus_on_load` to the UiKit users, channels and conversations selects (single and multi), checkboxes and radio buttons.

- ([#42562](https://github.com/RocketChat/Rocket.Chat/pull/42562)) Adds `focus_on_load` to UiKit text, number, email, URL, date, time and date-time inputs, so an app can choose which field has focus when a modal or contextual bar opens.

- ([#42562](https://github.com/RocketChat/Rocket.Chat/pull/42562)) Adds the UiKit `number_input`, `email_text_input` and `url_text_input` elements for `input` blocks. `number_input` supports `is_decimal_allowed`, `min_value` and `max_value`; all three accept `placeholder` and `initial_value`, and submit their value as a string.

- ([#42562](https://github.com/RocketChat/Rocket.Chat/pull/42562)) Adds the UiKit `header` block: a large plain-text title that separates sections of messages, modals and contextual bars.

- ([#42562](https://github.com/RocketChat/Rocket.Chat/pull/42562)) Adds the UiKit `markdown` block: a longer piece of Markdown, rendered like a chat message, in messages, modals and contextual bars.

- ([#42562](https://github.com/RocketChat/Rocket.Chat/pull/42562)) Adds `max_selected_items` to the UiKit multi users, channels and conversations selects; once that many entries are selected, no others can be picked.

- ([#42562](https://github.com/RocketChat/Rocket.Chat/pull/42562)) Lets UiKit `section` blocks take checkboxes, radio buttons, a time picker and the users, channels and conversations selects (single and multi) as their accessory.

- ([#42562](https://github.com/RocketChat/Rocket.Chat/pull/42562)) Adds initial selections to the UiKit users, channels and conversations selects: `initial_user`/`initial_users` (usernames), `initial_channel`/`initial_channels` and `initial_conversation`/`initial_conversations` (room ids). Selected entries now keep their chips even when the current search does not return them.

- ([#42854](https://github.com/RocketChat/Rocket.Chat/pull/42854)) Adds the UiKit `table` block: rows of plain or formatted cells, with a header row and per-column alignment and wrapping, in messages, modals and contextual bars.

- ([#42854](https://github.com/RocketChat/Rocket.Chat/pull/42854)) Adds the UiKit `video` block: a video shown as its thumbnail with a title, description and provider, which plays in place from an `https` embeddable page once clicked, in messages, modals and contextual bars.

### Patch Changes

- ([#42640](https://github.com/RocketChat/Rocket.Chat/pull/42640)) Fixes UiKit image URLs not being sanitized before CSS interpolation.

- ([#42975](https://github.com/RocketChat/Rocket.Chat/pull/42975)) Fixes `chat.sendMessage` accepting message fields that only the server may set, and malformed message blocks that made a room unreadable

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

- ([#43047](https://github.com/RocketChat/Rocket.Chat/pull/43047)) Spaces the elements of actions blocks and info card rows with a container gap instead of a negative margin offset by per-element margins

- ([#42853](https://github.com/RocketChat/Rocket.Chat/pull/42853)) Fixes UiKit `icon_button` elements showing no tooltip and having no accessible name: their `label` now shows on hover and names the button.

- ([#42564](https://github.com/RocketChat/Rocket.Chat/pull/42564)) Fixes UiKit input block labels not being associated with text, date and time inputs, so screen readers announced those fields without a name and clicking the label did not focus them.

- ([#42567](https://github.com/RocketChat/Rocket.Chat/pull/42567)) Fixes UiKit checkboxes and radio buttons ignoring each option's `description` and not linking their labels to the inputs: descriptions now show under the option text, and clicking the text selects the option.

- ([#42562](https://github.com/RocketChat/Rocket.Chat/pull/42562)) Fixes UiKit users, channels and conversations selects (single and multi) rendering nothing inside `actions` blocks; they were only drawn inside `input` blocks.

- ([#42564](https://github.com/RocketChat/Rocket.Chat/pull/42564)) Fixes UiKit `callout` blocks not rendering in banners and in messages. Each UiKit surface now has a single list of accepted layout blocks, exported by `@rocket.chat/ui-kit` (`messageSurfaceLayoutBlockTypes`, `modalSurfaceLayoutBlockTypes`, `bannerSurfaceLayoutBlockTypes`, `contextualBarSurfaceLayoutBlockTypes`, `attachmentSurfaceLayoutBlockTypes`) and shared by the surface types, the `UiKitParser*` classes and the Fuselage renderers. The surface types now also include every block the web client already rendered: `input` and `info_card` in messages, `preview` in modals, `preview` and `info_card` in banners, and `callout`, `preview` and `tab_navigation` in the contextual bar.

- ([#42560](https://github.com/RocketChat/Rocket.Chat/pull/42560)) Fixes UiKit buttons, icon buttons and overflow options opening `javascript:`, `data:` and `vbscript:` URLs sent by apps. Those URLs are now ignored; every other URL, including app deep links and relative URLs, still opens. Overflow options in the web client, which never opened their URL, now open it in a new tab without access to the opener. `@rocket.chat/ui-kit` exports the check as `isSafeUrl`.

- <details><summary>Updated dependencies [4f350b4ffb76024d9bf44c02f3322c8f9071f1cf, 1034e1f85d8e82788ca9590a185370aaf6efc4fb, 1034e1f85d8e82788ca9590a185370aaf6efc4fb, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 53bf8feb0c2075ee243d90c42ca2934098b93709, 6bb0d3bca9b5da401050697d51bc99e89871bbb7, 6be3614cd2660ab4024635802fdf9cd7dd7b502f, 7fbb5676fe0d2c034f4c52586ab858b3796e5dc6, 5c7b25f68d677d8bdbde3ed4c56ad0bba60ce71d, 5c7b25f68d677d8bdbde3ed4c56ad0bba60ce71d, 4c379a0d016fcf010bab86ddd94a22ff2401606e, 766ac93fba3c991c79c9bfcb404f6ec7fd1e30f8, 7fbb5676fe0d2c034f4c52586ab858b3796e5dc6, 4c379a0d016fcf010bab86ddd94a22ff2401606e, ad08045f56e3921e88ed021aa2945c9ba670e5f5, cea4d4428a0d86c6fc868542d4fb00a36ffaa27d, 7fbb5676fe0d2c034f4c52586ab858b3796e5dc6, 4c379a0d016fcf010bab86ddd94a22ff2401606e, 25fd477c2c38f71e9a16b7e2896d39efd43bfc61, 05e9b38a001919252360351f0bc3e46cc990a6ac, 25fd477c2c38f71e9a16b7e2896d39efd43bfc61, 2184b09b0bdacdb0bced60dc054a818a92c98131, e1b509fbca35eba10e21e4aa3bc15c56f44a2845, 0285f08c086dae6beb0f1365a85f522fb4818435, 6b86dffd3a05f65fff000bb697fbb40350664629, 5e6b6bd25ea82b9c884d49871870f71dc532a061, 588311c49bfce08e7106e7c0bb32741334fa5321, 10b4e00e08951ace8f9c27d83fc0c48be010bdc7, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, e1b509fbca35eba10e21e4aa3bc15c56f44a2845, 2d3331be63dde3449245963c33444dcb15fa8869, 5e82e67eaa4c998870d3eb0597f485b30c244f02, a9b2bb76d88e4d2743e0817b15e6447e7c9c46eb, c9aa43916295df79a799e53b8e09c58011991a97, cdd948cb67ecf282f6cc8f411615c3de0db0b9f1, 6b3ec3e667c99015e381a4e8ea43146accb5f7f7, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 9e401e55fbd71b95dc7c4b273024219ce2564856, a11ffff8acb74fd016e9ddb972da6eebda0c3e5e, e2f037838f6226f4894faa28613cc86f6d6f8e2d, a838cc5af0652f59d0ab30aa1a488abded0622b1, f3fa7abd6b9d311f76619d0fe27793ac68f6d208, daa677895dad92d6aab1e84a09f190efd2755ef9, 642d9e528a8572208e2f0bb51f45ea78400bcea3, bd92e8abc5a8f0161f3de5308979a0f88d09f351, 39a6e6e1397e1e89bc631fe4ab1cc10fa93b59e8, 87667dcb84de0ce97f4ace88c900801254fa6535, 87667dcb84de0ce97f4ace88c900801254fa6535, 87667dcb84de0ce97f4ace88c900801254fa6535, 87667dcb84de0ce97f4ace88c900801254fa6535, 87667dcb84de0ce97f4ace88c900801254fa6535, cd88334c72f7f2310706abc4d481a2712019e373, a39b03fe5c248079365162e31994e1dece63e7c2, ec12f66a28435f99fbce9cbb00ef49193f5b0d34, 9dfedc72439d12f5d2985b9dd54daccd97e11e74, ec12f66a28435f99fbce9cbb00ef49193f5b0d34, ec12f66a28435f99fbce9cbb00ef49193f5b0d34, ec12f66a28435f99fbce9cbb00ef49193f5b0d34, 9dfedc72439d12f5d2985b9dd54daccd97e11e74, ec12f66a28435f99fbce9cbb00ef49193f5b0d34, ec12f66a28435f99fbce9cbb00ef49193f5b0d34, ec12f66a28435f99fbce9cbb00ef49193f5b0d34, ec12f66a28435f99fbce9cbb00ef49193f5b0d34, ec12f66a28435f99fbce9cbb00ef49193f5b0d34, ec12f66a28435f99fbce9cbb00ef49193f5b0d34, bb586dc723b3dccdf725d28f530b28cfa857020a, ec12f66a28435f99fbce9cbb00ef49193f5b0d34, ec12f66a28435f99fbce9cbb00ef49193f5b0d34, 23698f9d08d34d3c145f116b5303b542e8342f9e, 9dfedc72439d12f5d2985b9dd54daccd97e11e74, e1070288debfecc5e49e118c3dc535f95936281f, 9dfedc72439d12f5d2985b9dd54daccd97e11e74, 982270a515cc061aafccb82a0605a36ce929d56c, 8fddbd4ebf2e4ac77a716b22a676077054506b7b]:</summary>
  - @rocket.chat/core-typings@9.0.0-rc.0
  - @rocket.chat/apps-engine@1.68.0-rc.0
  - @rocket.chat/fuselage@1.0.0-rc.0
  - @rocket.chat/ui-contexts@36.0.0-rc.0
  - @rocket.chat/fuselage-hooks@0.44.0-rc.0
  - @rocket.chat/icons@0.52.0-rc.0
  - @rocket.chat/gazzodown@36.0.0-rc.0
  - @rocket.chat/ui-kit@2.0.0-rc.0
  - @rocket.chat/styled@0.34.2-rc.0
  - @rocket.chat/ui-avatar@32.0.0-rc.0
  - @rocket.chat/ui-video-conf@36.0.0-rc.0

  </details>

## 35.0.0

### Minor Changes

- ([#41657](https://github.com/RocketChat/Rocket.Chat/pull/41657)) Gives a video conference a chat that outlives it, and a window of its own to hold both — behind a new Premium setting, **`VideoConf_Conference_Window_Enabled`**, which is **off by default**.

  Nothing below happens until an administrator turns that setting on. With it off, calls behave exactly as they did before: the provider's own page opens in a tab, an incoming call is a popup over the screen, a direct call rings from the room and waits there, and no new request is made of the server. The setting is also independent of `VideoConf_Enable_Persistent_Chat`, which keeps meaning only what it always meant — a discussion or thread per call — so a workspace already running persistent chat sees no change either until the new setting is turned on.

  With it on:

  Joining a conference opens a dedicated call window at `/conference/:id` — the provider's call beside the conference's chat, with the people on the call in a panel of their own — instead of handing the user off to the provider's page. A preflight screen opens first: it is where the camera and microphone are chosen, where whoever started a group call can name it, and where confirming is what actually creates the call, so a call nobody confirmed leaves no message, no ring and no history behind. Closing the window reports leaving, and a call nobody is left in ends by itself.

  Where a call's chat lives becomes a choice. `VideoConf_Persistent_Chat_Mode`, editable only with both the call window and persistent chat on, either puts the chat in a thread off the call's message — listed under the call's name — or leaves it in the room, with the discussion per call that persistent chat has always created. The thread is Rocket.Chat's own chat panel rather than anything the provider supplies, so it applies whoever runs the media, an iframed provider included. Turning the window off puts the answer back to the discussion whatever the mode was left at, so a workspace already running persistent chat is left exactly where it was.

  Adding someone to a conference makes them a member of the **conference** rather than putting them in a room. Membership authorizes joining the call alongside room access, so a person from outside the conference's room can join without being handed the room's history — and whether they can read the chat becomes a separate question, surfaced once it matters with a choice of how to resolve it: bring them into the room, or move the chat to a discussion. `video-conference.info` reports the members who can't read it and `POST /v1/video-conference.share-chat` applies the remedy; `video-conference.add-participants` takes the call and the usernames to add, and returns the ids it added.

  An incoming call is no longer a popup demanding an answer. It is the first item of a list of the calls running now — behind a navigation-bar button — where it can be accepted, turned down, or silenced and left ringing while the user finishes what they were doing. That list is also how a call is reached when its ring was missed entirely, which a one-shot ring in a room of more than ten people always is (`GET /v1/video-conference.joinable`).

  Conferences appear in the personal Call History from the moment they start, as `ongoing`, settling per member into `ended` or `not-answered` when the call stops — so a call that was declined or never answered is still in the log, and still joinable from it. The room's own call list stops counting members who were added but never joined.

  New endpoints: `video-conference.decline` (recorded against the caller's own membership, never ending the call for anyone else), `.leave`, `.ring` (to try someone again — a ring is one-shot, so there was previously no second attempt), `.rename` and `.share-chat`. A single `video-conference.updated` stream event tells an open call window that the conference it is showing has changed.

### Patch Changes

- <details><summary>Updated dependencies [17dfc71b4ad7294655e7fab9043cddbea23cb071, 71add68eca423511c0189f2f541b5a2c46a5e7a0, 53b519cc692587a63beaeb780e28d368ed70e94c, 356203b9ef1fe1dec13096d0f012e7a72770be0a, 7d7a5c403e175df889afe303c34b9154c4ad6d70, bab7af7e18ea2e70e2b3211904a4adfc6ae33e7c, 37faaa89ad1b4b721d6054e40a91327bd8140525]:</summary>
  - @rocket.chat/core-typings@8.9.0
  - @rocket.chat/apps-engine@1.67.0
  - @rocket.chat/ui-kit@1.2.0
  - @rocket.chat/gazzodown@35.0.0
  - @rocket.chat/ui-video-conf@35.0.0
  - @rocket.chat/ui-avatar@31.0.0
  - @rocket.chat/ui-contexts@35.0.0

  </details>

## 35.0.0-rc.0

### Minor Changes

- ([#41657](https://github.com/RocketChat/Rocket.Chat/pull/41657)) Gives a video conference a chat that outlives it, and a window of its own to hold both — behind a new Premium setting, **`VideoConf_Conference_Window_Enabled`**, which is **off by default**.

  Nothing below happens until an administrator turns that setting on. With it off, calls behave exactly as they did before: the provider's own page opens in a tab, an incoming call is a popup over the screen, a direct call rings from the room and waits there, and no new request is made of the server. The setting is also independent of `VideoConf_Enable_Persistent_Chat`, which keeps meaning only what it always meant — a discussion or thread per call — so a workspace already running persistent chat sees no change either until the new setting is turned on.

  With it on:

  Joining a conference opens a dedicated call window at `/conference/:id` — the provider's call beside the conference's chat, with the people on the call in a panel of their own — instead of handing the user off to the provider's page. A preflight screen opens first: it is where the camera and microphone are chosen, where whoever started a group call can name it, and where confirming is what actually creates the call, so a call nobody confirmed leaves no message, no ring and no history behind. Closing the window reports leaving, and a call nobody is left in ends by itself.

  Where a call's chat lives becomes a choice. `VideoConf_Persistent_Chat_Mode`, editable only with both the call window and persistent chat on, either puts the chat in a thread off the call's message — listed under the call's name — or leaves it in the room, with the discussion per call that persistent chat has always created. The thread is Rocket.Chat's own chat panel rather than anything the provider supplies, so it applies whoever runs the media, an iframed provider included. Turning the window off puts the answer back to the discussion whatever the mode was left at, so a workspace already running persistent chat is left exactly where it was.

  Adding someone to a conference makes them a member of the **conference** rather than putting them in a room. Membership authorizes joining the call alongside room access, so a person from outside the conference's room can join without being handed the room's history — and whether they can read the chat becomes a separate question, surfaced once it matters with a choice of how to resolve it: bring them into the room, or move the chat to a discussion. `video-conference.info` reports the members who can't read it and `POST /v1/video-conference.share-chat` applies the remedy; `video-conference.add-participants` takes the call and the usernames to add, and returns the ids it added.

  An incoming call is no longer a popup demanding an answer. It is the first item of a list of the calls running now — behind a navigation-bar button — where it can be accepted, turned down, or silenced and left ringing while the user finishes what they were doing. That list is also how a call is reached when its ring was missed entirely, which a one-shot ring in a room of more than ten people always is (`GET /v1/video-conference.joinable`).

  Conferences appear in the personal Call History from the moment they start, as `ongoing`, settling per member into `ended` or `not-answered` when the call stops — so a call that was declined or never answered is still in the log, and still joinable from it. The room's own call list stops counting members who were added but never joined.

  New endpoints: `video-conference.decline` (recorded against the caller's own membership, never ending the call for anyone else), `.leave`, `.ring` (to try someone again — a ring is one-shot, so there was previously no second attempt), `.rename` and `.share-chat`. A single `video-conference.updated` stream event tells an open call window that the conference it is showing has changed.

### Patch Changes

- <details><summary>Updated dependencies [17dfc71b4ad7294655e7fab9043cddbea23cb071, 71add68eca423511c0189f2f541b5a2c46a5e7a0, 53b519cc692587a63beaeb780e28d368ed70e94c, 356203b9ef1fe1dec13096d0f012e7a72770be0a, 7d7a5c403e175df889afe303c34b9154c4ad6d70, bab7af7e18ea2e70e2b3211904a4adfc6ae33e7c, 37faaa89ad1b4b721d6054e40a91327bd8140525]:</summary>
  - @rocket.chat/core-typings@8.9.0-rc.0
  - @rocket.chat/apps-engine@1.67.0-rc.0
  - @rocket.chat/ui-kit@1.2.0-rc.0
  - @rocket.chat/gazzodown@35.0.0-rc.0
  - @rocket.chat/ui-contexts@35.0.0-rc.0
  - @rocket.chat/ui-avatar@31.0.0-rc.0
  - @rocket.chat/ui-video-conf@35.0.0-rc.0

  </details>

## 34.0.0

### Patch Changes

- <details><summary>Updated dependencies [126e446ca50ee6ae17abf0b31f4f1917c72e5a2f, 4947601bbf042cd1b2385f8f5dda438e608faea7, 0869925e52ca61a440a01a6646935b89af8c7aae, b89a8d411ef65f6931a5fd1cd057740bc00cd9ba]:</summary>
  - @rocket.chat/apps-engine@1.66.0
  - @rocket.chat/core-typings@8.8.0
  - @rocket.chat/gazzodown@34.0.0
  - @rocket.chat/ui-avatar@30.0.0
  - @rocket.chat/ui-contexts@34.0.0
  - @rocket.chat/ui-video-conf@34.0.0

  </details>

## 34.0.0-rc.0

### Patch Changes

- <details><summary>Updated dependencies [126e446ca50ee6ae17abf0b31f4f1917c72e5a2f, 4947601bbf042cd1b2385f8f5dda438e608faea7, 0869925e52ca61a440a01a6646935b89af8c7aae, b89a8d411ef65f6931a5fd1cd057740bc00cd9ba]:</summary>
  - @rocket.chat/apps-engine@1.66.0-rc.0
  - @rocket.chat/core-typings@8.8.0-rc.0
  - @rocket.chat/ui-contexts@34.0.0-rc.0
  - @rocket.chat/gazzodown@34.0.0-rc.0
  - @rocket.chat/ui-kit@1.1.0
  - @rocket.chat/ui-video-conf@34.0.0-rc.0
  - @rocket.chat/ui-avatar@30.0.0-rc.0

  </details>

## 33.0.0

### Patch Changes

- <details><summary>Updated dependencies [c7aff48a40a9a78924cbf27fd38930c536ee11e5, 5f92f9a27dca70d506d919351612bd32dc04241a, 70c0ff0967cc50144dba4971fc7c3f3e996264a3, 13b4a7b2dc203959b77b3b0c5f154d3e34fe2058, 4b34bd62f2ac8d51efd2f48caea7092e87f30ce7, 1bf84cbe288df03fc622fbddbc0e434bda291c2f, 8d8cd01d0a4e6872ed543320c966efd52140e884, 3cd7db677a72521439b564dca7a4ca6d6c3a1c07, 4186deb7febee0aa653bb48b27022afa36529b21, 4117a1d3fb07905e8c9488a96f368747b48d528e, 615ae2bf74bba0402e0151d9c0b8e4f8dd04cb17, e5da5d016948c9bb5cfd784a65396e08e61264c4]:</summary>
  - @rocket.chat/core-typings@8.7.0
  - @rocket.chat/gazzodown@33.0.0
  - @rocket.chat/apps-engine@1.65.1
  - @rocket.chat/ui-avatar@29.0.0
  - @rocket.chat/ui-contexts@33.0.0
  - @rocket.chat/ui-video-conf@33.0.0

  </details>

## 33.0.0-rc.0

### Patch Changes

- <details><summary>Updated dependencies [c7aff48a40a9a78924cbf27fd38930c536ee11e5, 5f92f9a27dca70d506d919351612bd32dc04241a, 70c0ff0967cc50144dba4971fc7c3f3e996264a3, 13b4a7b2dc203959b77b3b0c5f154d3e34fe2058, 4b34bd62f2ac8d51efd2f48caea7092e87f30ce7, 1bf84cbe288df03fc622fbddbc0e434bda291c2f, 8d8cd01d0a4e6872ed543320c966efd52140e884, 3cd7db677a72521439b564dca7a4ca6d6c3a1c07, 4186deb7febee0aa653bb48b27022afa36529b21, 4117a1d3fb07905e8c9488a96f368747b48d528e, 615ae2bf74bba0402e0151d9c0b8e4f8dd04cb17, e5da5d016948c9bb5cfd784a65396e08e61264c4]:</summary>
  - @rocket.chat/core-typings@8.7.0-rc.0
  - @rocket.chat/gazzodown@33.0.0-rc.0
  - @rocket.chat/apps-engine@1.64.1-rc.0
  - @rocket.chat/ui-contexts@33.0.0-rc.0
  - @rocket.chat/ui-avatar@29.0.0-rc.0
  - @rocket.chat/ui-video-conf@33.0.0-rc.0

  </details>

## 32.0.0

### Patch Changes

- <details><summary>Updated dependencies [7380c44c751eff9ee624d80bf26370411ffed78b, 6bd9182ae1d914a55e70866db43e8d2038f7be28, 6fa5378a940cbc809800b3c7d7c0639810bb0ab8, f63b965f82b0ddc590c633706f7c31c8c5251b53, 9ab1cf6e088cc099f4fc2ba9460ce5dd41bd1dc2]:</summary>
  - @rocket.chat/core-typings@8.6.0
  - @rocket.chat/apps-engine@1.64.0
  - @rocket.chat/gazzodown@32.0.0
  - @rocket.chat/ui-avatar@28.0.0
  - @rocket.chat/ui-contexts@32.0.0
  - @rocket.chat/ui-video-conf@32.0.0

  </details>

## 32.0.0-rc.0

### Patch Changes

- <details><summary>Updated dependencies [7380c44c751eff9ee624d80bf26370411ffed78b, 6bd9182ae1d914a55e70866db43e8d2038f7be28, f63b965f82b0ddc590c633706f7c31c8c5251b53, 9ab1cf6e088cc099f4fc2ba9460ce5dd41bd1dc2]:</summary>
  - @rocket.chat/core-typings@8.6.0-rc.0
  - @rocket.chat/apps-engine@1.64.0-rc.0
  - @rocket.chat/ui-contexts@32.0.0-rc.0
  - @rocket.chat/gazzodown@32.0.0-rc.0
  - @rocket.chat/ui-avatar@28.0.0-rc.0
  - @rocket.chat/ui-video-conf@32.0.0-rc.0

  </details>

## 31.0.0

### Patch Changes

- <details><summary>Updated dependencies [90f15e32ae843ed146ccf711ee3201408d1e8731, 2a927fa1362c9d4bb04bb8e26f23a6e3753d9cea, d427b808c1f79d9d1baa05bb5b5ef805b6ef5f6d, f392d5cc8d956c199f557dcd6beb52094232499d, 2198d9ea565b06f92e3dec29891890086f62f9df, 12897e25d0dc25b7373f5264d38f38a5a7444257, 0b7a76367d650793c271160e01798ebbb5fe0d26, 90f15e32ae843ed146ccf711ee3201408d1e8731]:</summary>
  - @rocket.chat/ui-kit@1.1.0
  - @rocket.chat/apps-engine@1.63.0
  - @rocket.chat/gazzodown@31.0.0
  - @rocket.chat/core-typings@8.5.0
  - @rocket.chat/ui-avatar@27.0.0
  - @rocket.chat/ui-contexts@31.0.0
  - @rocket.chat/ui-video-conf@31.0.0

  </details>

## 31.0.0-rc.0

### Patch Changes

- <details><summary>Updated dependencies [90f15e32ae843ed146ccf711ee3201408d1e8731, 2a927fa1362c9d4bb04bb8e26f23a6e3753d9cea, ae9f740d6af20557eac61b4af902c868b4132b49, d427b808c1f79d9d1baa05bb5b5ef805b6ef5f6d, f392d5cc8d956c199f557dcd6beb52094232499d, 2198d9ea565b06f92e3dec29891890086f62f9df, 12897e25d0dc25b7373f5264d38f38a5a7444257, 0b7a76367d650793c271160e01798ebbb5fe0d26, 90f15e32ae843ed146ccf711ee3201408d1e8731]:</summary>
  - @rocket.chat/ui-kit@1.1.0-rc.0
  - @rocket.chat/apps-engine@1.63.0-rc.0
  - @rocket.chat/core-typings@8.5.0-rc.0
  - @rocket.chat/gazzodown@31.0.0-rc.0
  - @rocket.chat/ui-contexts@31.0.0-rc.0
  - @rocket.chat/ui-avatar@27.0.0-rc.0
  - @rocket.chat/ui-video-conf@31.0.0-rc.0

  </details>

## 30.0.0

### Patch Changes

- <details><summary>Updated dependencies [278b84f78360e53792a2e5d7620615039a0e15e9, 24b3671fe61b8b09c6a1b5dc6401b503b3fb92a0, 5cff1f41d388b036c77a8f774f233b1921e9066e, e792aba7f56f1b2ece62951087591819995a1446, c544b805d1c03f8eae9d061cd48838206207a7c9, 8c0e16ca29b393cfa50b425520db48ba5a74f678]:</summary>
  - @rocket.chat/core-typings@8.4.0
  - @rocket.chat/apps-engine@1.62.0
  - @rocket.chat/gazzodown@30.0.0
  - @rocket.chat/ui-avatar@26.0.0
  - @rocket.chat/ui-contexts@30.0.0
  - @rocket.chat/ui-video-conf@30.0.0

  </details>

## 30.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@8.4.0-rc.2
  - @rocket.chat/gazzodown@30.0.0-rc.2
  - @rocket.chat/ui-avatar@26.0.0-rc.2
  - @rocket.chat/ui-contexts@30.0.0-rc.2
  - @rocket.chat/ui-video-conf@30.0.0-rc.2

  </details>

## 30.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@30.0.0-rc.1
  - @rocket.chat/gazzodown@30.0.0-rc.1
  - @rocket.chat/ui-avatar@26.0.0-rc.1
  - @rocket.chat/ui-video-conf@30.0.0-rc.1
  - @rocket.chat/core-typings@8.4.0-rc.1

  </details>

## 29.0.2

### Patch Changes

- <details><summary>Updated dependencies [356a6026dda4821a3e28752def7c8619ac860975]:</summary>
  - @rocket.chat/apps-engine@1.61.1
  - @rocket.chat/core-typings@8.3.2
  - @rocket.chat/gazzodown@29.0.2
  - @rocket.chat/ui-avatar@25.0.2
  - @rocket.chat/ui-contexts@29.0.2
  - @rocket.chat/ui-video-conf@29.0.2

  </details>

## 29.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@8.3.1
  - @rocket.chat/gazzodown@29.0.1
  - @rocket.chat/ui-avatar@25.0.1
  - @rocket.chat/ui-contexts@29.0.1
  - @rocket.chat/ui-video-conf@29.0.1

  </details>

## 30.0.0-rc.0

### Patch Changes

- <details><summary>Updated dependencies [278b84f78360e53792a2e5d7620615039a0e15e9, 24b3671fe61b8b09c6a1b5dc6401b503b3fb92a0, 5cff1f41d388b036c77a8f774f233b1921e9066e, e792aba7f56f1b2ece62951087591819995a1446, c544b805d1c03f8eae9d061cd48838206207a7c9, 8c0e16ca29b393cfa50b425520db48ba5a74f678]:</summary>
  - @rocket.chat/core-typings@8.4.0-rc.0
  - @rocket.chat/apps-engine@1.62.0-rc.0
  - @rocket.chat/gazzodown@30.0.0-rc.0
  - @rocket.chat/ui-avatar@26.0.0-rc.0
  - @rocket.chat/ui-contexts@30.0.0-rc.0
  - @rocket.chat/ui-video-conf@30.0.0-rc.0

  </details>

## 29.0.0

### Minor Changes

- ([#39268](https://github.com/RocketChat/Rocket.Chat/pull/39268)) refactor(ui-kit): Remove UiKit deprecations

### Patch Changes

- ([#38989](https://github.com/RocketChat/Rocket.Chat/pull/38989)) chore(eslint): Upgrades ESLint and its configuration

- <details><summary>Updated dependencies [87f9262af4a543d52642a54e1ef546d509a79e23, 539659af22bc19880eda047dfc0b152472ccb65c, 78e37dc3deae4ff05f5e33f9134c7094fd6c1330, 43d0cfc6a70e8a31d5f3d24162216dae6b07efdd, d83a1a9753464ee916845b3c88757bbcf76884a5, 722df6f60bc86c51b204e28a39acb3dc8710bdeb, c117492ad90d291a361eedc929506f557495caf7]:</summary>
  - @rocket.chat/ui-kit@1.0.0
  - @rocket.chat/apps-engine@1.61.0
  - @rocket.chat/ui-video-conf@29.0.0
  - @rocket.chat/core-typings@8.3.0
  - @rocket.chat/ui-contexts@29.0.0
  - @rocket.chat/gazzodown@29.0.0
  - @rocket.chat/ui-avatar@25.0.0

  </details>

## 29.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@8.3.0-rc.4
  - @rocket.chat/gazzodown@29.0.0-rc.4
  - @rocket.chat/ui-avatar@25.0.0-rc.4
  - @rocket.chat/ui-contexts@29.0.0-rc.4
  - @rocket.chat/ui-video-conf@29.0.0-rc.4

  </details>

## 29.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@8.3.0-rc.3
  - @rocket.chat/gazzodown@29.0.0-rc.3
  - @rocket.chat/ui-avatar@25.0.0-rc.3
  - @rocket.chat/ui-contexts@29.0.0-rc.3
  - @rocket.chat/ui-video-conf@29.0.0-rc.3

  </details>

## 29.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@8.3.0-rc.2
  - @rocket.chat/gazzodown@29.0.0-rc.2
  - @rocket.chat/ui-avatar@25.0.0-rc.2
  - @rocket.chat/ui-contexts@29.0.0-rc.2
  - @rocket.chat/ui-video-conf@29.0.0-rc.2

  </details>

## 29.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@8.3.0-rc.1
  - @rocket.chat/gazzodown@29.0.0-rc.1
  - @rocket.chat/ui-avatar@25.0.0-rc.1
  - @rocket.chat/ui-contexts@29.0.0-rc.1
  - @rocket.chat/ui-video-conf@29.0.0-rc.1

  </details>

## 29.0.0-rc.0

### Minor Changes

- ([#39268](https://github.com/RocketChat/Rocket.Chat/pull/39268)) refactor(ui-kit): Remove UiKit deprecations

### Patch Changes

- ([#38989](https://github.com/RocketChat/Rocket.Chat/pull/38989)) chore(eslint): Upgrades ESLint and its configuration

- <details><summary>Updated dependencies [87f9262af4a543d52642a54e1ef546d509a79e23, 539659af22bc19880eda047dfc0b152472ccb65c, 78e37dc3deae4ff05f5e33f9134c7094fd6c1330, 43d0cfc6a70e8a31d5f3d24162216dae6b07efdd, d83a1a9753464ee916845b3c88757bbcf76884a5, 722df6f60bc86c51b204e28a39acb3dc8710bdeb, c117492ad90d291a361eedc929506f557495caf7]:</summary>
  - @rocket.chat/ui-kit@1.0.0-rc.0
  - @rocket.chat/apps-engine@1.61.0-rc.0
  - @rocket.chat/ui-video-conf@29.0.0-rc.0
  - @rocket.chat/core-typings@8.3.0-rc.0
  - @rocket.chat/ui-contexts@29.0.0-rc.0
  - @rocket.chat/gazzodown@29.0.0-rc.0
  - @rocket.chat/ui-avatar@25.0.0-rc.0

  </details>

## 28.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@8.2.1
  - @rocket.chat/gazzodown@28.0.1
  - @rocket.chat/ui-avatar@24.0.1
  - @rocket.chat/ui-contexts@28.0.1
  - @rocket.chat/ui-video-conf@28.0.1

  </details>

## 28.0.0

### Patch Changes

- <details><summary>Updated dependencies [bbc14893f10baa6d548274485d1a2470efccfd55, 11821455ea6a8c1cac2a43c433254864b8b2c5f8, d3758a7d57ab602745369ef9d2ccdbf9271cf305, 398fca05554d860a1202c7afd78912f1254257f5, fbc4935dec220495201cf905017170d3cd1e275c, e57f15845e4df048dd2f08f11aa08215780a2c34]:</summary>
  - @rocket.chat/apps-engine@1.60.0
  - @rocket.chat/core-typings@8.2.0
  - @rocket.chat/gazzodown@28.0.0
  - @rocket.chat/ui-avatar@24.0.0
  - @rocket.chat/ui-contexts@28.0.0
  - @rocket.chat/ui-video-conf@28.0.0

  </details>

## 28.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@8.2.0-rc.2
  - @rocket.chat/gazzodown@28.0.0-rc.2
  - @rocket.chat/ui-avatar@24.0.0-rc.2
  - @rocket.chat/ui-contexts@28.0.0-rc.2
  - @rocket.chat/ui-video-conf@28.0.0-rc.2

  </details>

## 28.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@8.2.0-rc.1
  - @rocket.chat/gazzodown@28.0.0-rc.1
  - @rocket.chat/ui-avatar@24.0.0-rc.1
  - @rocket.chat/ui-contexts@28.0.0-rc.1
  - @rocket.chat/ui-video-conf@28.0.0-rc.1

  </details>

## 28.0.0-rc.0

### Patch Changes

- <details><summary>Updated dependencies [bbc14893f10baa6d548274485d1a2470efccfd55, 11821455ea6a8c1cac2a43c433254864b8b2c5f8, d3758a7d57ab602745369ef9d2ccdbf9271cf305, 398fca05554d860a1202c7afd78912f1254257f5, fbc4935dec220495201cf905017170d3cd1e275c, e57f15845e4df048dd2f08f11aa08215780a2c34]:</summary>
  - @rocket.chat/apps-engine@1.60.0-rc.0
  - @rocket.chat/core-typings@8.2.0-rc.0
  - @rocket.chat/gazzodown@28.0.0-rc.0
  - @rocket.chat/ui-avatar@24.0.0-rc.0
  - @rocket.chat/ui-contexts@28.0.0-rc.0
  - @rocket.chat/ui-video-conf@28.0.0-rc.0

  </details>

## 27.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@8.1.1
  - @rocket.chat/gazzodown@27.0.1
  - @rocket.chat/ui-avatar@23.0.1
  - @rocket.chat/ui-contexts@27.0.1
  - @rocket.chat/ui-video-conf@27.0.1

  </details>

## 27.0.0

### Patch Changes

- <details><summary>Updated dependencies [6654c5b481f91bdcb03d68ee0f3a12d58201137e, c547985fbb8e434f2cba0035840c1be21a2a2ddd]:</summary>
  - @rocket.chat/core-typings@8.1.0
  - @rocket.chat/apps-engine@1.59.1
  - @rocket.chat/gazzodown@27.0.0
  - @rocket.chat/ui-contexts@27.0.0
  - @rocket.chat/ui-avatar@23.0.0
  - @rocket.chat/ui-video-conf@27.0.0

  </details>

## 27.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@8.1.0-rc.2
  - @rocket.chat/gazzodown@27.0.0-rc.2
  - @rocket.chat/ui-avatar@23.0.0-rc.2
  - @rocket.chat/ui-contexts@27.0.0-rc.2
  - @rocket.chat/ui-video-conf@27.0.0-rc.2

  </details>

## 27.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@27.0.0-rc.1
  - @rocket.chat/gazzodown@27.0.0-rc.1
  - @rocket.chat/ui-avatar@23.0.0-rc.1
  - @rocket.chat/ui-video-conf@27.0.0-rc.1
  - @rocket.chat/core-typings@8.1.0-rc.1
  </details>

## 27.0.0-rc.0

### Patch Changes

- <details><summary>Updated dependencies [6654c5b481f91bdcb03d68ee0f3a12d58201137e, c547985fbb8e434f2cba0035840c1be21a2a2ddd]:</summary>
  - @rocket.chat/core-typings@8.1.0-rc.0
  - @rocket.chat/apps-engine@1.59.1-rc.0
  - @rocket.chat/gazzodown@27.0.0-rc.0
  - @rocket.chat/ui-contexts@27.0.0-rc.0
  - @rocket.chat/ui-avatar@23.0.0-rc.0
  - @rocket.chat/ui-video-conf@27.0.0-rc.0

  </details>

## 26.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
- @rocket.chat/core-typings@8.0.1
  - @rocket.chat/gazzodown@26.0.1
  - @rocket.chat/ui-avatar@22.0.1
  - @rocket.chat/ui-contexts@26.0.1
  - @rocket.chat/ui-video-conf@26.0.1
  </details>

## 26.0.0

### Minor Changes

- ([#37726](https://github.com/RocketChat/Rocket.Chat/pull/37726)) Introduces a new variation of the `Icon` element to `ui-kit` through the new `framed` optional property.

### Patch Changes

- ([#37768](https://github.com/RocketChat/Rocket.Chat/pull/37768)) Fixes an issue with the `action` block inside `Info Card` ui-kit element not dispatching actions.

- <details><summary>Updated dependencies [0ccb9692b434bc88b4bc5009d39e024c03f01b86, 176d5eae3fb249d7d20c3e260d9fadc1a56a2fca, ac11ea05ffadeca978c794ff38d5199d9acb2c29, 0c0258604632342f42fc36cabac2d6cfe0e477c4, ac11ea05ffadeca978c794ff38d5199d9acb2c29, 70872896b912004dc016297b6e875d873d81dc3a, ddc935727e9a7275813006d9dcaa7fe866610844, d3538e7045c41f91b8c561d44e5485ff93b93745, 73d9eb2783176954f42aa2cbeda8abf1d49ac260]:</summary>
  - @rocket.chat/apps-engine@1.59.0
  - @rocket.chat/core-typings@8.0.0
  - @rocket.chat/ui-contexts@26.0.0
  - @rocket.chat/gazzodown@26.0.0
  - @rocket.chat/ui-kit@0.39.0
  - @rocket.chat/ui-avatar@22.0.0
  - @rocket.chat/ui-video-conf@26.0.0

  </details>

## 26.0.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@8.0.0-rc.5
  - @rocket.chat/gazzodown@26.0.0-rc.5
  - @rocket.chat/ui-avatar@22.0.0-rc.5
  - @rocket.chat/ui-contexts@26.0.0-rc.5
  - @rocket.chat/ui-video-conf@26.0.0-rc.5

  </details>

## 26.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@8.0.0-rc.4
  - @rocket.chat/gazzodown@26.0.0-rc.4
  - @rocket.chat/ui-avatar@22.0.0-rc.4
  - @rocket.chat/ui-contexts@26.0.0-rc.4
  - @rocket.chat/ui-video-conf@26.0.0-rc.4

  </details>

## 26.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@26.0.0-rc.3
  - @rocket.chat/gazzodown@26.0.0-rc.3
  - @rocket.chat/ui-avatar@22.0.0-rc.3
  - @rocket.chat/ui-video-conf@26.0.0-rc.3
  - @rocket.chat/core-typings@8.0.0-rc.3

  </details>

## 26.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@8.0.0-rc.2
  - @rocket.chat/gazzodown@26.0.0-rc.2
  - @rocket.chat/ui-avatar@22.0.0-rc.2
  - @rocket.chat/ui-contexts@26.0.0-rc.2
  - @rocket.chat/ui-video-conf@26.0.0-rc.2

  </details>

## 26.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@8.0.0-rc.1
  - @rocket.chat/gazzodown@26.0.0-rc.1
  - @rocket.chat/ui-avatar@22.0.0-rc.1
  - @rocket.chat/ui-contexts@26.0.0-rc.1
  - @rocket.chat/ui-video-conf@26.0.0-rc.1

  </details>

## 26.0.0-rc.0

### Minor Changes

- ([#37726](https://github.com/RocketChat/Rocket.Chat/pull/37726)) Introduces a new variation of the `Icon` element to `ui-kit` through the new `framed` optional property.

### Patch Changes

- ([#37768](https://github.com/RocketChat/Rocket.Chat/pull/37768)) Fixes an issue with the `action` block inside `Info Card` ui-kit element not dispatching actions.

- <details><summary>Updated dependencies [0ccb9692b434bc88b4bc5009d39e024c03f01b86, 176d5eae3fb249d7d20c3e260d9fadc1a56a2fca, ac11ea05ffadeca978c794ff38d5199d9acb2c29, 0c0258604632342f42fc36cabac2d6cfe0e477c4, ac11ea05ffadeca978c794ff38d5199d9acb2c29, 70872896b912004dc016297b6e875d873d81dc3a, ddc935727e9a7275813006d9dcaa7fe866610844, d3538e7045c41f91b8c561d44e5485ff93b93745, 73d9eb2783176954f42aa2cbeda8abf1d49ac260]:</summary>
  - @rocket.chat/apps-engine@1.59.0-rc.0
  - @rocket.chat/core-typings@8.0.0-rc.0
  - @rocket.chat/ui-contexts@26.0.0-rc.0
  - @rocket.chat/gazzodown@26.0.0-rc.0
  - @rocket.chat/ui-kit@0.39.0-rc.0
  - @rocket.chat/ui-avatar@22.0.0-rc.0
  - @rocket.chat/ui-video-conf@26.0.0-rc.0

  </details>

## 25.0.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.13.2
  - @rocket.chat/gazzodown@25.0.2
  - @rocket.chat/ui-avatar@21.0.2
  - @rocket.chat/ui-contexts@25.0.2
  - @rocket.chat/ui-video-conf@25.0.2

  </details>

## 25.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.13.1
  - @rocket.chat/gazzodown@25.0.1
  - @rocket.chat/ui-avatar@21.0.1
  - @rocket.chat/ui-contexts@25.0.1
  - @rocket.chat/ui-video-conf@25.0.1

  </details>

## 25.0.0

### Minor Changes

- ([#37398](https://github.com/RocketChat/Rocket.Chat/pull/37398)) Adds new elements for building apps (ui-kit): `icon` (block element), `icon_button` (block element) and `info_card` (layout block).

### Patch Changes

- <details><summary>Updated dependencies [31ab78f0d4648b2ba99513ffce737d52ee34fe7f, 5f075eabe1ed1292e3eda2bcca58b5323936dd13, 7f1b834a55b1240c226afde77713262da47f45dc, 5c7e8ec1de894e7b8eeb6e57b0c8a43bd22d2d46, 44ca3b111f13ac1816a82ab0e4720e9886769c34, 99255057f27b9d854a89da815681a03d0776f846, ec22d9c102d48908bac33865b00abde4f4738ced, 64a4e8bbb70f28532d8967de6936e3bbe6603f8b, 65fbcbed9f64004b953dd9d4182b3fccb8147339, cd0f72faa58908349b7968a9288d289185d0c770, a05b8f72ca70dfed2959282c35518f78fbeb65cf, 7a7aad5cb1191c0eca61a22dadd620bd4f6c12a2]:</summary>
  - @rocket.chat/ui-contexts@25.0.0
  - @rocket.chat/apps-engine@1.58.0
  - @rocket.chat/core-typings@7.13.0
  - @rocket.chat/ui-kit@0.38.0
  - @rocket.chat/gazzodown@25.0.0
  - @rocket.chat/ui-avatar@21.0.0
  - @rocket.chat/ui-video-conf@25.0.0

  </details>

## 25.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.13.0-rc.2
  - @rocket.chat/gazzodown@25.0.0-rc.2
  - @rocket.chat/ui-avatar@21.0.0-rc.2
  - @rocket.chat/ui-contexts@25.0.0-rc.2
  - @rocket.chat/ui-video-conf@25.0.0-rc.2

  </details>

## 25.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.13.0-rc.1
  - @rocket.chat/gazzodown@25.0.0-rc.1
  - @rocket.chat/ui-avatar@21.0.0-rc.1
  - @rocket.chat/ui-contexts@25.0.0-rc.1
  - @rocket.chat/ui-video-conf@25.0.0-rc.1
  </details>

## 25.0.0-rc.0

### Minor Changes

- ([#37398](https://github.com/RocketChat/Rocket.Chat/pull/37398)) Adds new elements for building apps (ui-kit): `icon` (block element), `icon_button` (block element) and `info_card` (layout block).

### Patch Changes

- <details><summary>Updated dependencies [31ab78f0d4648b2ba99513ffce737d52ee34fe7f, 5f075eabe1ed1292e3eda2bcca58b5323936dd13, 7f1b834a55b1240c226afde77713262da47f45dc, 5c7e8ec1de894e7b8eeb6e57b0c8a43bd22d2d46, 44ca3b111f13ac1816a82ab0e4720e9886769c34, 99255057f27b9d854a89da815681a03d0776f846, ec22d9c102d48908bac33865b00abde4f4738ced, 64a4e8bbb70f28532d8967de6936e3bbe6603f8b, 65fbcbed9f64004b953dd9d4182b3fccb8147339, cd0f72faa58908349b7968a9288d289185d0c770, a05b8f72ca70dfed2959282c35518f78fbeb65cf, 7a7aad5cb1191c0eca61a22dadd620bd4f6c12a2]:</summary>
  - @rocket.chat/ui-contexts@25.0.0-rc.0
  - @rocket.chat/apps-engine@1.58.0-rc.0
  - @rocket.chat/core-typings@7.13.0-rc.0
  - @rocket.chat/ui-kit@0.38.0-rc.0
  - @rocket.chat/gazzodown@25.0.0-rc.0
  - @rocket.chat/ui-avatar@21.0.0-rc.0
  - @rocket.chat/ui-video-conf@25.0.0-rc.0

## 24.0.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.12.2
  - @rocket.chat/gazzodown@24.0.2
  - @rocket.chat/ui-avatar@20.0.2
  - @rocket.chat/ui-contexts@24.0.2
  - @rocket.chat/ui-video-conf@24.0.2

  </details>

## 24.0.1

### Patch Changes

- <details><summary>Updated dependencies [e6cc073a99e1aaa7936ef9b29e7bfa31dab86aa3]:</summary>
  - @rocket.chat/apps-engine@1.57.1
  - @rocket.chat/core-typings@7.12.1
  - @rocket.chat/gazzodown@24.0.1
  - @rocket.chat/ui-avatar@20.0.1
  - @rocket.chat/ui-contexts@24.0.1
  - @rocket.chat/ui-video-conf@24.0.1

  </details>

## 24.0.0

### Patch Changes

- <details><summary>Updated dependencies [c253db3ece80da36fba7b79b3cbe64d705175d6d, f627e675076a49ebd2f7c80cee1c2a3e51cc22fc, a25e88c06cafdbe3baf7a40e3bffe3aed5a81cf6, d166e2a1ffba4e59361d5f79e8c376fca5cbf12f]:</summary>
  - @rocket.chat/apps-engine@1.57.0
  - @rocket.chat/ui-contexts@24.0.0
  - @rocket.chat/core-typings@7.12.0
  - @rocket.chat/gazzodown@24.0.0
  - @rocket.chat/ui-avatar@20.0.0
  - @rocket.chat/ui-video-conf@24.0.0

  </details>

## 24.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.12.0-rc.4
  - @rocket.chat/gazzodown@24.0.0-rc.4
  - @rocket.chat/ui-avatar@20.0.0-rc.4
  - @rocket.chat/ui-contexts@24.0.0-rc.4
  - @rocket.chat/ui-video-conf@24.0.0-rc.4

  </details>

## 24.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.12.0-rc.3
  - @rocket.chat/gazzodown@24.0.0-rc.3
  - @rocket.chat/ui-avatar@20.0.0-rc.3
  - @rocket.chat/ui-contexts@24.0.0-rc.3
  - @rocket.chat/ui-video-conf@24.0.0-rc.3

  </details>

## 24.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.12.0-rc.2
  - @rocket.chat/gazzodown@24.0.0-rc.2
  - @rocket.chat/ui-avatar@20.0.0-rc.2
  - @rocket.chat/ui-contexts@24.0.0-rc.2
  - @rocket.chat/ui-video-conf@24.0.0-rc.2

  </details>

## 24.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.12.0-rc.1
  - @rocket.chat/gazzodown@24.0.0-rc.1
  - @rocket.chat/ui-avatar@20.0.0-rc.1
  - @rocket.chat/ui-contexts@24.0.0-rc.1
  - @rocket.chat/ui-video-conf@24.0.0-rc.1

  </details>

## 24.0.0-rc.0

### Patch Changes

- <details><summary>Updated dependencies [c253db3ece80da36fba7b79b3cbe64d705175d6d, f627e675076a49ebd2f7c80cee1c2a3e51cc22fc, a25e88c06cafdbe3baf7a40e3bffe3aed5a81cf6, d166e2a1ffba4e59361d5f79e8c376fca5cbf12f]:</summary>
  - @rocket.chat/apps-engine@1.57.0-rc.0
  - @rocket.chat/ui-contexts@24.0.0-rc.0
  - @rocket.chat/core-typings@7.12.0-rc.0
  - @rocket.chat/gazzodown@24.0.0-rc.0
  - @rocket.chat/ui-avatar@20.0.0-rc.0
  - @rocket.chat/ui-video-conf@24.0.0-rc.0

  </details>

## 23.0.0

### Patch Changes

- ([#36207](https://github.com/RocketChat/Rocket.Chat/pull/36207)) Introduces the Outbound Message feature to Omnichannel, allowing organizations to initiate proactive communication with contacts through their preferred messaging channel directly from Rocket.Chat

- <details><summary>Updated dependencies [f139c0d42790f0df076f32b4184f6b846bcdbc26, d76a5578ed0e14fae2a041c0e09d565b28630d76, 3484c1fa14beafa62460f00de5a89cbfa4fa0db5, feba290fc403de27efb6bb9a571bec43413e976a, b0a4602a4461200b9872b2b073ec56fa55ecb466, 72d9474b2f9149d8690d3483237bd2273d6799ac, c6ef437d9071dbd8c08152984dc39542b1ae7306]:</summary>
  - @rocket.chat/apps-engine@1.56.0
  - @rocket.chat/gazzodown@23.0.0
  - @rocket.chat/ui-contexts@23.0.0
  - @rocket.chat/ui-video-conf@23.0.0
  - @rocket.chat/ui-avatar@19.0.0
  - @rocket.chat/core-typings@7.11.0

  </details>

## 23.0.0-rc.7

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.11.0-rc.7
  - @rocket.chat/gazzodown@23.0.0-rc.7
  - @rocket.chat/ui-avatar@19.0.0-rc.7
  - @rocket.chat/ui-contexts@23.0.0-rc.7
  - @rocket.chat/ui-video-conf@23.0.0-rc.7

  </details>

## 23.0.0-rc.6

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.11.0-rc.6
  - @rocket.chat/gazzodown@23.0.0-rc.6
  - @rocket.chat/ui-avatar@19.0.0-rc.6
  - @rocket.chat/ui-contexts@23.0.0-rc.6
  - @rocket.chat/ui-video-conf@23.0.0-rc.6

  </details>

## 23.0.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.11.0-rc.5
  - @rocket.chat/gazzodown@23.0.0-rc.5
  - @rocket.chat/ui-avatar@19.0.0-rc.5
  - @rocket.chat/ui-contexts@23.0.0-rc.5
  - @rocket.chat/ui-video-conf@23.0.0-rc.5

  </details>

## 23.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.11.0-rc.4
  - @rocket.chat/gazzodown@23.0.0-rc.4
  - @rocket.chat/ui-avatar@19.0.0-rc.4
  - @rocket.chat/ui-contexts@23.0.0-rc.4
  - @rocket.chat/ui-video-conf@23.0.0-rc.4

  </details>

## 23.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.11.0-rc.3
  - @rocket.chat/gazzodown@23.0.0-rc.3
  - @rocket.chat/ui-avatar@19.0.0-rc.3
  - @rocket.chat/ui-contexts@23.0.0-rc.3
  - @rocket.chat/ui-video-conf@23.0.0-rc.3

  </details>

## 23.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.11.0-rc.2
  - @rocket.chat/gazzodown@23.0.0-rc.2
  - @rocket.chat/ui-avatar@19.0.0-rc.2
  - @rocket.chat/ui-contexts@23.0.0-rc.2
  - @rocket.chat/ui-video-conf@23.0.0-rc.2

  </details>

## 23.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.11.0-rc.1
  - @rocket.chat/gazzodown@23.0.0-rc.1
  - @rocket.chat/ui-avatar@19.0.0-rc.1
  - @rocket.chat/ui-contexts@23.0.0-rc.1
  - @rocket.chat/ui-video-conf@23.0.0-rc.1

  </details>

## 23.0.0-rc.0

### Patch Changes

- ([#36207](https://github.com/RocketChat/Rocket.Chat/pull/36207)) Introduces the Outbound Message feature to Omnichannel, allowing organizations to initiate proactive communication with contacts through their preferred messaging channel directly from Rocket.Chat

- <details><summary>Updated dependencies [f139c0d42790f0df076f32b4184f6b846bcdbc26, d76a5578ed0e14fae2a041c0e09d565b28630d76, 3484c1fa14beafa62460f00de5a89cbfa4fa0db5, feba290fc403de27efb6bb9a571bec43413e976a, b0a4602a4461200b9872b2b073ec56fa55ecb466, 72d9474b2f9149d8690d3483237bd2273d6799ac, c6ef437d9071dbd8c08152984dc39542b1ae7306]:</summary>
  - @rocket.chat/apps-engine@1.56.0-rc.0
  - @rocket.chat/gazzodown@23.0.0-rc.0
  - @rocket.chat/ui-contexts@23.0.0-rc.0
  - @rocket.chat/ui-video-conf@23.0.0-rc.0
  - @rocket.chat/ui-avatar@19.0.0-rc.0
  - @rocket.chat/core-typings@7.11.0-rc.0

  </details>

## 22.0.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.10.2
  - @rocket.chat/gazzodown@22.0.2
  - @rocket.chat/ui-avatar@18.0.2
  - @rocket.chat/ui-contexts@22.0.2
  - @rocket.chat/ui-video-conf@22.0.2

  </details>

## 22.0.1

### Patch Changes

- <details><summary>Updated dependencies [42cea259937ceea4ba8ec62627e4ca40e7e02320]:</summary>
  - @rocket.chat/apps-engine@1.55.1
  - @rocket.chat/core-typings@7.10.1
  - @rocket.chat/gazzodown@22.0.1
  - @rocket.chat/ui-avatar@18.0.1
  - @rocket.chat/ui-contexts@22.0.1

  </details>

## 22.0.0

### Patch Changes

- <details><summary>Updated dependencies [22498de4e9de4467642f637d00cc8344ba876987, 128b228fcb0b2fda2967c88b07340be4b34a5470, c0c8919723c8d1242973625d15db74c994318460, 17bca96ecbf23ea807aba2e6e8abc95ebd66b0d0, 42979690f3880d3c700582b7892020e37bc82be3, c7db598e9f3c2ad47f6a6be2a9ba7078533c245b]:</summary>
  - @rocket.chat/apps-engine@1.55.0
  - @rocket.chat/core-typings@7.10.0
  - @rocket.chat/ui-contexts@22.0.0
  - @rocket.chat/gazzodown@22.0.0
  - @rocket.chat/ui-avatar@18.0.0
  - @rocket.chat/ui-video-conf@22.0.0

  </details>

## 22.0.0-rc.6

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.10.0-rc.6
  - @rocket.chat/gazzodown@22.0.0-rc.6
  - @rocket.chat/ui-avatar@18.0.0-rc.6
  - @rocket.chat/ui-contexts@22.0.0-rc.6
  - @rocket.chat/ui-video-conf@22.0.0-rc.6

  </details>

## 22.0.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.10.0-rc.5
  - @rocket.chat/gazzodown@22.0.0-rc.5
  - @rocket.chat/ui-avatar@18.0.0-rc.5
  - @rocket.chat/ui-contexts@22.0.0-rc.5
  - @rocket.chat/ui-video-conf@22.0.0-rc.5
  </details>

## 22.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.10.0-rc.4
  - @rocket.chat/gazzodown@22.0.0-rc.4
  - @rocket.chat/ui-avatar@18.0.0-rc.4
  - @rocket.chat/ui-contexts@22.0.0-rc.4
  - @rocket.chat/ui-video-conf@22.0.0-rc.4
  </details>

## 22.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies [128b228fcb0b2fda2967c88b07340be4b34a5470]:</summary>
  - @rocket.chat/apps-engine@1.55.0-rc.1
  - @rocket.chat/core-typings@7.10.0-rc.3
  - @rocket.chat/gazzodown@22.0.0-rc.3
  - @rocket.chat/ui-avatar@18.0.0-rc.3
  - @rocket.chat/ui-contexts@22.0.0-rc.3
  - @rocket.chat/ui-video-conf@22.0.0-rc.3

  </details>

## 22.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
- @rocket.chat/core-typings@7.10.0-rc.2
  - @rocket.chat/gazzodown@22.0.0-rc.2
  - @rocket.chat/ui-avatar@18.0.0-rc.2
  - @rocket.chat/ui-contexts@22.0.0-rc.2
  - @rocket.chat/ui-video-conf@22.0.0-rc.2
  </details>

## 22.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.10.0-rc.1
  - @rocket.chat/gazzodown@22.0.0-rc.1
  - @rocket.chat/ui-avatar@18.0.0-rc.1
  - @rocket.chat/ui-contexts@22.0.0-rc.1
  - @rocket.chat/ui-video-conf@22.0.0-rc.1

  </details>

## 22.0.0-rc.0

### Patch Changes

- <details><summary>Updated dependencies [22498de4e9de4467642f637d00cc8344ba876987, c0c8919723c8d1242973625d15db74c994318460, 17bca96ecbf23ea807aba2e6e8abc95ebd66b0d0, 42979690f3880d3c700582b7892020e37bc82be3, c7db598e9f3c2ad47f6a6be2a9ba7078533c245b]:</summary>
  - @rocket.chat/apps-engine@1.55.0-rc.0
  - @rocket.chat/core-typings@7.10.0-rc.0
  - @rocket.chat/ui-contexts@22.0.0-rc.0
  - @rocket.chat/gazzodown@22.0.0-rc.0
  - @rocket.chat/ui-avatar@18.0.0-rc.0
  - @rocket.chat/ui-video-conf@22.0.0-rc.0

  </details>

## 21.0.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.9.3
  - @rocket.chat/gazzodown@21.0.3
  - @rocket.chat/ui-avatar@17.0.3
  - @rocket.chat/ui-contexts@21.0.3
  - @rocket.chat/ui-video-conf@21.0.3
  </details>

## 21.0.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.9.2
  - @rocket.chat/gazzodown@21.0.2
  - @rocket.chat/ui-avatar@17.0.2
  - @rocket.chat/ui-contexts@21.0.2
  - @rocket.chat/ui-video-conf@21.0.2
  </details>

## 21.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.9.1
  - @rocket.chat/gazzodown@21.0.1
  - @rocket.chat/ui-avatar@17.0.1
  - @rocket.chat/ui-contexts@21.0.1
  - @rocket.chat/ui-video-conf@21.0.1
    </details>

## 21.0.0

### Patch Changes

- <details><summary>Updated dependencies [ba0cbd32657365abc2a10e50285e02b4e34bf674, 2cec8acd5beddf5ad0c67c29fe632487cb82b026, 6f205101215b4d9890ac62f7acc21257f0cd3cf4, fd478a7d45a4505ad53d2d7aec8b44e9bf8fa41a, cfabf2684046e1e336b1f81d548a081c25419677, 9826bc2ed9a3a4232ce6d5d436c3f489f2d4192b]:</summary>
  - @rocket.chat/gazzodown@21.0.0
  - @rocket.chat/apps-engine@1.54.0
  - @rocket.chat/core-typings@7.9.0
  - @rocket.chat/ui-contexts@21.0.0
  - @rocket.chat/ui-avatar@17.0.0
  - @rocket.chat/ui-video-conf@21.0.0

  </details>

## 21.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies [cfabf2684046e1e336b1f81d548a081c25419677]:</summary>
  - @rocket.chat/apps-engine@1.54.0-rc.1
  - @rocket.chat/core-typings@7.9.0-rc.2
  - @rocket.chat/gazzodown@21.0.0-rc.2
  - @rocket.chat/ui-avatar@17.0.0-rc.2
  - @rocket.chat/ui-contexts@21.0.0-rc.2
  - @rocket.chat/ui-video-conf@21.0.0-rc.2

  </details>

## 21.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.9.0-rc.1
  - @rocket.chat/gazzodown@21.0.0-rc.1
  - @rocket.chat/ui-avatar@17.0.0-rc.1
  - @rocket.chat/ui-contexts@21.0.0-rc.1
  - @rocket.chat/ui-video-conf@21.0.0-rc.1

  </details>

## 21.0.0-rc.0

### Patch Changes

- <details><summary>Updated dependencies [ba0cbd32657365abc2a10e50285e02b4e34bf674, 2cec8acd5beddf5ad0c67c29fe632487cb82b026, 6f205101215b4d9890ac62f7acc21257f0cd3cf4, fd478a7d45a4505ad53d2d7aec8b44e9bf8fa41a, 9826bc2ed9a3a4232ce6d5d436c3f489f2d4192b]:</summary>
  - @rocket.chat/gazzodown@21.0.0-rc.0
  - @rocket.chat/apps-engine@1.54.0-rc.0
  - @rocket.chat/core-typings@7.9.0-rc.0
  - @rocket.chat/ui-contexts@21.0.0-rc.0
  - @rocket.chat/ui-avatar@17.0.0-rc.0
  - @rocket.chat/ui-video-conf@21.0.0-rc.0

  </details>

## 20.0.3

### Patch Changes

- <details><summary>Updated dependencies [3c914ca4b4f9ae3246b149409c893b7610ae6570]:</summary>
  - @rocket.chat/apps-engine@1.53.1
  - @rocket.chat/core-typings@7.8.3
  - @rocket.chat/gazzodown@20.0.3
  - @rocket.chat/ui-contexts@20.0.3
  - @rocket.chat/ui-avatar@16.0.3
  - @rocket.chat/ui-video-conf@20.0.3

  </details>

## 20.0.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.8.2
  - @rocket.chat/gazzodown@20.0.2
  - @rocket.chat/ui-contexts@20.0.2
  - @rocket.chat/ui-avatar@16.0.2
  - @rocket.chat/ui-video-conf@20.0.2

  </details>

## 20.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.8.1
  - @rocket.chat/gazzodown@20.0.1
  - @rocket.chat/ui-contexts@20.0.1
  - @rocket.chat/ui-avatar@16.0.1
  - @rocket.chat/ui-video-conf@20.0.1

  </details>

## 20.0.0

### Patch Changes

- <details><summary>Updated dependencies [5ac20e2a84200f8002ce454df693ada2653f3827, 3d024a900426c8bbf646e7ebedce0e17c9f7c140, 3779de0e8c5787f266bdeda5052b27c023c65f1c, de4293a1ca5af138437bf01a78e7c0450f437dc7]:</summary>
  - @rocket.chat/apps-engine@1.53.0
  - @rocket.chat/core-typings@7.8.0
  - @rocket.chat/ui-contexts@20.0.0
  - @rocket.chat/gazzodown@20.0.0
  - @rocket.chat/ui-avatar@16.0.0
  - @rocket.chat/ui-video-conf@20.0.0

  </details>

## 20.0.0-rc.9

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.8.0-rc.9
  - @rocket.chat/gazzodown@20.0.0-rc.9
  - @rocket.chat/ui-contexts@20.0.0-rc.9
  - @rocket.chat/ui-avatar@16.0.0-rc.9
  - @rocket.chat/ui-video-conf@20.0.0-rc.9

  </details>

## 20.0.0-rc.8

### Patch Changes

- <details><summary>Updated dependencies [de4293a1ca5af138437bf01a78e7c0450f437dc7]:</summary>
  - @rocket.chat/apps-engine@1.53.0-rc.1
  - @rocket.chat/core-typings@7.8.0-rc.8
  - @rocket.chat/gazzodown@20.0.0-rc.8
  - @rocket.chat/ui-contexts@20.0.0-rc.8
  - @rocket.chat/ui-avatar@16.0.0-rc.8
  - @rocket.chat/ui-video-conf@20.0.0-rc.8

  </details>

## 20.0.0-rc.7

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.8.0-rc.7
  - @rocket.chat/gazzodown@20.0.0-rc.7
  - @rocket.chat/ui-contexts@20.0.0-rc.7
  - @rocket.chat/ui-avatar@16.0.0-rc.7
  - @rocket.chat/ui-video-conf@20.0.0-rc.7

  </details>

## 20.0.0-rc.6

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.8.0-rc.6
  - @rocket.chat/gazzodown@20.0.0-rc.6
  - @rocket.chat/ui-contexts@20.0.0-rc.6
  - @rocket.chat/ui-avatar@16.0.0-rc.6
  - @rocket.chat/ui-video-conf@20.0.0-rc.6

  </details>

## 20.0.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.8.0-rc.5
  - @rocket.chat/gazzodown@20.0.0-rc.5
  - @rocket.chat/ui-contexts@20.0.0-rc.5
  - @rocket.chat/ui-avatar@16.0.0-rc.5
  - @rocket.chat/ui-video-conf@20.0.0-rc.5

  </details>

## 20.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.8.0-rc.4
  - @rocket.chat/gazzodown@20.0.0-rc.4
  - @rocket.chat/ui-contexts@20.0.0-rc.4
  - @rocket.chat/ui-avatar@16.0.0-rc.4
  - @rocket.chat/ui-video-conf@20.0.0-rc.4

  </details>

## 20.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@20.0.0-rc.3
  - @rocket.chat/gazzodown@20.0.0-rc.3
  - @rocket.chat/ui-avatar@16.0.0-rc.3
  - @rocket.chat/ui-video-conf@20.0.0-rc.3
  - @rocket.chat/core-typings@7.8.0-rc.3

  </details>

## 20.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.8.0-rc.2
  - @rocket.chat/gazzodown@20.0.0-rc.2
  - @rocket.chat/ui-contexts@20.0.0-rc.2
  - @rocket.chat/ui-avatar@16.0.0-rc.2
  - @rocket.chat/ui-video-conf@20.0.0-rc.2

  </details>

## 20.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
- @rocket.chat/core-typings@7.8.0-rc.1
  - @rocket.chat/gazzodown@20.0.0-rc.1
  - @rocket.chat/ui-contexts@20.0.0-rc.1
  - @rocket.chat/ui-avatar@16.0.0-rc.1
  - @rocket.chat/ui-video-conf@20.0.0-rc.1
  </details>

## 20.0.0-rc.0

### Patch Changes

- <details><summary>Updated dependencies [5ac20e2a84200f8002ce454df693ada2653f3827, 3d024a900426c8bbf646e7ebedce0e17c9f7c140, 3779de0e8c5787f266bdeda5052b27c023c65f1c]:</summary>
  - @rocket.chat/apps-engine@1.53.0-rc.0
  - @rocket.chat/core-typings@7.8.0-rc.0
  - @rocket.chat/ui-contexts@20.0.0-rc.0
  - @rocket.chat/gazzodown@20.0.0-rc.0
  - @rocket.chat/ui-avatar@16.0.0-rc.0
  - @rocket.chat/ui-video-conf@20.0.0-rc.0

  </details>

## 19.0.4

### Patch Changes

- <details><summary>Updated dependencies [46662d78192b438914b2aedb974faa2367225fa5]:</summary>
  - @rocket.chat/apps-engine@1.52.1
  - @rocket.chat/core-typings@7.7.4
  - @rocket.chat/gazzodown@19.0.4
  - @rocket.chat/ui-contexts@19.0.4
  - @rocket.chat/ui-avatar@15.0.4
  - @rocket.chat/ui-video-conf@19.0.4

  </details>

## 19.0.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
- @rocket.chat/core-typings@7.7.3
  - @rocket.chat/gazzodown@19.0.3
  - @rocket.chat/ui-contexts@19.0.3
  - @rocket.chat/ui-avatar@15.0.3
  - @rocket.chat/ui-video-conf@19.0.3
  </details>

## 19.0.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@19.0.2
  - @rocket.chat/gazzodown@19.0.2
  - @rocket.chat/ui-avatar@15.0.2
  - @rocket.chat/ui-video-conf@19.0.2
  - @rocket.chat/core-typings@7.7.2

  </details>

## 19.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@19.0.1
  - @rocket.chat/gazzodown@19.0.1
  - @rocket.chat/ui-avatar@15.0.1
  - @rocket.chat/ui-video-conf@19.0.1
  - @rocket.chat/core-typings@7.7.1

  </details>

## 19.0.0

### Patch Changes

- <details><summary>Updated dependencies [7f9748374a3b04f7880003227cde7058e5ea9a68, 7f9748374a3b04f7880003227cde7058e5ea9a68, 8d907087746dd75bd640c6d51ae0bbb7f3dc43c0, 821cd886891370443117d7caa05c43fc7c3dd0c7]:</summary>
  - @rocket.chat/apps-engine@1.52.0
  - @rocket.chat/gazzodown@19.0.0
  - @rocket.chat/ui-contexts@19.0.0
  - @rocket.chat/core-typings@7.7.0
  - @rocket.chat/ui-avatar@15.0.0
  - @rocket.chat/ui-video-conf@19.0.0

  </details>

## 19.0.0-rc.6

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.7.0-rc.6
  - @rocket.chat/gazzodown@19.0.0-rc.6
  - @rocket.chat/ui-contexts@19.0.0-rc.6
  - @rocket.chat/ui-avatar@15.0.0-rc.6
  - @rocket.chat/ui-video-conf@19.0.0-rc.6

  </details>

## 19.0.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.7.0-rc.5
  - @rocket.chat/gazzodown@19.0.0-rc.5
  - @rocket.chat/ui-contexts@19.0.0-rc.5
  - @rocket.chat/ui-avatar@15.0.0-rc.5
  - @rocket.chat/ui-video-conf@19.0.0-rc.5

  </details>

## 19.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.7.1-rc.4
  - @rocket.chat/gazzodown@19.0.0-rc.4
  - @rocket.chat/ui-contexts@19.0.0-rc.4
  - @rocket.chat/ui-avatar@15.0.0-rc.4
  - @rocket.chat/ui-video-conf@19.0.0-rc.4

  </details>

## 19.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.7.0-rc.3
  - @rocket.chat/gazzodown@19.0.0-rc.3
  - @rocket.chat/ui-contexts@19.0.0-rc.3
  - @rocket.chat/ui-avatar@15.0.0-rc.3
  - @rocket.chat/ui-video-conf@19.0.0-rc.3
  </details>

## 18.0.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.6.2
  - @rocket.chat/gazzodown@18.0.2
  - @rocket.chat/ui-contexts@18.0.2
  - @rocket.chat/ui-avatar@14.0.2
  - @rocket.chat/ui-video-conf@18.0.2
  </details>

## 18.0.1

### Patch Changes

- <details><summary>Updated dependencies [587c3cafbd631b4275fd05497d3e463713583cc0]:</summary>
  - @rocket.chat/apps-engine@1.51.1
  - @rocket.chat/core-typings@7.6.1
  - @rocket.chat/gazzodown@18.0.1
  - @rocket.chat/ui-contexts@18.0.1
  - @rocket.chat/ui-avatar@14.0.1
  - @rocket.chat/ui-video-conf@18.0.1

  </details>

## 18.0.0

### Patch Changes

- <details><summary>Updated dependencies [aec9eaa941fe9dad81f38d8d18d1b58edd700eb1, 2c190740d0ff166a4cefe8e833b0b2682a41fab1, d649a761edd71e1325a635b757ef1df2e5a778a4, bbd14f84214b4785f2b58cfeb8e9117bdfbf18e8, 1eeb139158fcd621a2b8d3a7de5bb512e659261d, d8eb824d242cbbeafb11b1c4a806860e4541ba79, bbd0b0d9ed181a156430e2a446d3b56092e3f645, 47ae69912cd90743e7bf836fdee4be481a01bbba, 4b28126ac94cf1d3312b30ad9863ca02673f49d4, 4690c55d8e379d0bd5dfa444f3e0a4175e88d8de]:</summary>
  - @rocket.chat/core-typings@7.6.0
  - @rocket.chat/apps-engine@1.51.0
  - @rocket.chat/ui-contexts@18.0.0
  - @rocket.chat/gazzodown@18.0.0
  - @rocket.chat/ui-avatar@14.0.0
  - @rocket.chat/ui-video-conf@18.0.0

  </details>

## 18.0.0-rc.8

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.6.0-rc.8
  - @rocket.chat/gazzodown@18.0.0-rc.8
  - @rocket.chat/ui-contexts@18.0.0-rc.8
  - @rocket.chat/ui-avatar@14.0.0-rc.8
  - @rocket.chat/ui-video-conf@18.0.0-rc.8

  </details>

## 18.0.0-rc.7

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.6.0-rc.7
  - @rocket.chat/gazzodown@18.0.0-rc.7
  - @rocket.chat/ui-contexts@18.0.0-rc.7
  - @rocket.chat/ui-avatar@14.0.0-rc.7
  - @rocket.chat/ui-video-conf@18.0.0-rc.7

  </details>

## 18.0.0-rc.6

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.6.0-rc.6
  - @rocket.chat/gazzodown@18.0.0-rc.6
  - @rocket.chat/ui-contexts@18.0.0-rc.6
  - @rocket.chat/ui-avatar@14.0.0-rc.6
  - @rocket.chat/ui-video-conf@18.0.0-rc.6

  </details>

## 18.0.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.6.0-rc.5
  - @rocket.chat/gazzodown@18.0.0-rc.5
  - @rocket.chat/ui-contexts@18.0.0-rc.5
  - @rocket.chat/ui-avatar@14.0.0-rc.5
  - @rocket.chat/ui-video-conf@18.0.0-rc.5

  </details>

## 18.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.6.0-rc.4
  - @rocket.chat/gazzodown@18.0.0-rc.4
  - @rocket.chat/ui-contexts@18.0.0-rc.4
  - @rocket.chat/ui-avatar@14.0.0-rc.4
  - @rocket.chat/ui-video-conf@18.0.0-rc.4

  </details>

## 18.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.6.0-rc.3
  - @rocket.chat/gazzodown@18.0.0-rc.3
  - @rocket.chat/ui-contexts@18.0.0-rc.3
  - @rocket.chat/ui-avatar@14.0.0-rc.3
  - @rocket.chat/ui-video-conf@18.0.0-rc.3

  </details>

## 18.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.6.0-rc.2
  - @rocket.chat/gazzodown@18.0.0-rc.2
  - @rocket.chat/ui-contexts@18.0.0-rc.2
  - @rocket.chat/ui-avatar@14.0.0-rc.2
  - @rocket.chat/ui-video-conf@18.0.0-rc.2

  </details>

## 18.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.6.0-rc.1
  - @rocket.chat/gazzodown@18.0.0-rc.1
  - @rocket.chat/ui-contexts@18.0.0-rc.1
  - @rocket.chat/ui-avatar@14.0.0-rc.1
  - @rocket.chat/ui-video-conf@18.0.0-rc.1

  </details>

## 18.0.0-rc.0

### Patch Changes

- <details><summary>Updated dependencies [aec9eaa941fe9dad81f38d8d18d1b58edd700eb1, 2c190740d0ff166a4cefe8e833b0b2682a41fab1, d649a761edd71e1325a635b757ef1df2e5a778a4, bbd14f84214b4785f2b58cfeb8e9117bdfbf18e8, 1eeb139158fcd621a2b8d3a7de5bb512e659261d, d8eb824d242cbbeafb11b1c4a806860e4541ba79, bbd0b0d9ed181a156430e2a446d3b56092e3f645, 47ae69912cd90743e7bf836fdee4be481a01bbba, 4b28126ac94cf1d3312b30ad9863ca02673f49d4, 4690c55d8e379d0bd5dfa444f3e0a4175e88d8de]:</summary>
  - @rocket.chat/core-typings@7.6.0-rc.0
  - @rocket.chat/apps-engine@1.51.0-rc.0
  - @rocket.chat/ui-contexts@18.0.0-rc.0
  - @rocket.chat/gazzodown@18.0.0-rc.0
  - @rocket.chat/ui-avatar@14.0.0-rc.0
  - @rocket.chat/ui-video-conf@18.0.0-rc.0

  </details>

## 17.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.5.1
  - @rocket.chat/gazzodown@17.0.1
  - @rocket.chat/ui-contexts@17.0.1
  - @rocket.chat/ui-avatar@13.0.1
  - @rocket.chat/ui-video-conf@17.0.1

  </details>

## 17.0.0

### Patch Changes

- ([#35286](https://github.com/RocketChat/Rocket.Chat/pull/35286)) Bumps fuselage and related packages versions to use the most recent releases of each package, especially the fix for the missing track of the fuselage slider component

- <details><summary>Updated dependencies [c7b21f1c1e479533a208771f3e15f064f2c7e3ff, 4e9d3155db516718fdd28be30a53d0051c9144d3, 25592391b04a5a9c5e4be57a3878bca7c7db66b2, c904862b1496cab943e97d28b36d3a24deac21c1, 38f1c508c9f95cd34744066019927add53470446, c618263e8e5fa9459f48d262e5dd9e20c59c1410, c44331e0d9b0e4e04d1ec64bea74b439a1125aa0, 0d96d633a653f52d07bc9ebeead16dcb90c75e2c, d7ea246e0f7837cd3cc93f99316683b75a2faa43]:</summary>
  - @rocket.chat/gazzodown@17.0.0
  - @rocket.chat/ui-avatar@13.0.0
  - @rocket.chat/ui-contexts@17.0.0
  - @rocket.chat/ui-video-conf@17.0.0
  - @rocket.chat/apps-engine@1.50.0
  - @rocket.chat/core-typings@7.5.0

  </details>

## 17.0.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.5.0-rc.5
  - @rocket.chat/gazzodown@17.0.0-rc.5
  - @rocket.chat/ui-contexts@17.0.0-rc.5
  - @rocket.chat/ui-avatar@13.0.0-rc.5
  - @rocket.chat/ui-video-conf@17.0.0-rc.5

  </details>

## 17.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies [c618263e8e5fa9459f48d262e5dd9e20c59c1410, d7ea246e0f7837cd3cc93f99316683b75a2faa43]:</summary>
  - @rocket.chat/apps-engine@1.50.0-rc.1
  - @rocket.chat/core-typings@7.5.0-rc.4
  - @rocket.chat/gazzodown@17.0.0-rc.4
  - @rocket.chat/ui-contexts@17.0.0-rc.4
  - @rocket.chat/ui-avatar@13.0.0-rc.4
  - @rocket.chat/ui-video-conf@17.0.0-rc.4

  </details>

## 17.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.5.0-rc.3
  - @rocket.chat/gazzodown@17.0.0-rc.3
  - @rocket.chat/ui-contexts@17.0.0-rc.3
  - @rocket.chat/ui-avatar@13.0.0-rc.3
  - @rocket.chat/ui-video-conf@17.0.0-rc.3

  </details>

## 17.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@17.0.0-rc.2
  - @rocket.chat/gazzodown@17.0.0-rc.2
  - @rocket.chat/ui-avatar@13.0.0-rc.2
  - @rocket.chat/ui-video-conf@17.0.0-rc.2
  - @rocket.chat/core-typings@7.5.0-rc.2

  </details>

## 17.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.5.0-rc.1
  - @rocket.chat/gazzodown@17.0.0-rc.1
  - @rocket.chat/ui-contexts@17.0.0-rc.1
  - @rocket.chat/ui-avatar@13.0.0-rc.1
  - @rocket.chat/ui-video-conf@17.0.0-rc.1

  </details>

## 17.0.0-rc.0

### Patch Changes

- ([#35286](https://github.com/RocketChat/Rocket.Chat/pull/35286)) Bumps fuselage and related packages versions to use the most recent releases of each package, especially the fix for the missing track of the fuselage slider component

- <details><summary>Updated dependencies [c7b21f1c1e479533a208771f3e15f064f2c7e3ff, 4e9d3155db516718fdd28be30a53d0051c9144d3, 25592391b04a5a9c5e4be57a3878bca7c7db66b2, c904862b1496cab943e97d28b36d3a24deac21c1, 38f1c508c9f95cd34744066019927add53470446, c44331e0d9b0e4e04d1ec64bea74b439a1125aa0, 0d96d633a653f52d07bc9ebeead16dcb90c75e2c]:</summary>
  - @rocket.chat/gazzodown@17.0.0-rc.0
  - @rocket.chat/ui-avatar@13.0.0-rc.0
  - @rocket.chat/ui-contexts@17.0.0-rc.0
  - @rocket.chat/ui-video-conf@17.0.0-rc.0
  - @rocket.chat/apps-engine@1.50.0-rc.0
  - @rocket.chat/core-typings@7.5.0-rc.0

  </details>

## 16.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.4.1
  - @rocket.chat/gazzodown@16.0.1
  - @rocket.chat/ui-contexts@16.0.1
  - @rocket.chat/ui-avatar@12.0.1
  - @rocket.chat/ui-video-conf@16.0.1

  </details>

## 16.0.0

### Patch Changes

- ([#35120](https://github.com/RocketChat/Rocket.Chat/pull/35120)) Fixes behavior of app updates that would save undesired field changes to documents

- ([#33141](https://github.com/RocketChat/Rocket.Chat/pull/33141)) Fixes an issue where video conf message block wasn't considering display avatars preference

- <details><summary>Updated dependencies [89964144e042c8d9282b51efd89e1e684077fdd7, 2921a6aa6f7c971a29c8209574cfb66432bc9f47, 083fc49cf718e460dd6e8fcd72b98b42aeb6fc86, f85da08765a9d3f8c5aabd9291fd08be6dfdeb85, 271894fb3942d5d0ce3d669325d07fbbbc4bf112, 697a38d23590ac799f0f3c14a676fb6bea7e86ea, be5031a21bdcda31270d53d319f7d183e77d84d7, 36e90a2eb2f9698f7ba42f6e8429a240114426bf]:</summary>
  - @rocket.chat/ui-video-conf@16.0.0
  - @rocket.chat/core-typings@7.4.0
  - @rocket.chat/apps-engine@1.49.0
  - @rocket.chat/ui-contexts@16.0.0
  - @rocket.chat/gazzodown@16.0.0
  - @rocket.chat/ui-avatar@12.0.0

  </details>

## 16.0.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.4.0-rc.5
  - @rocket.chat/gazzodown@16.0.0-rc.5
  - @rocket.chat/ui-contexts@16.0.0-rc.5
  - @rocket.chat/ui-avatar@12.0.0-rc.5
  - @rocket.chat/ui-video-conf@16.0.0-rc.5

  </details>

## 16.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.4.0-rc.4
  - @rocket.chat/gazzodown@16.0.0-rc.4
  - @rocket.chat/ui-contexts@16.0.0-rc.4
  - @rocket.chat/ui-avatar@12.0.0-rc.4
  - @rocket.chat/ui-video-conf@16.0.0-rc.4

  </details>

## 16.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.4.0-rc.3
  - @rocket.chat/gazzodown@16.0.0-rc.3
  - @rocket.chat/ui-contexts@16.0.0-rc.3
  - @rocket.chat/ui-avatar@12.0.0-rc.3
  - @rocket.chat/ui-video-conf@16.0.0-rc.3
  </details>

## 16.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.4.0-rc.2
  - @rocket.chat/gazzodown@16.0.0-rc.2
  - @rocket.chat/ui-contexts@16.0.0-rc.2
  - @rocket.chat/ui-avatar@12.0.0-rc.2
  - @rocket.chat/ui-video-conf@16.0.0-rc.2

  </details>

## 16.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.4.0-rc.1
  - @rocket.chat/gazzodown@16.0.0-rc.1
  - @rocket.chat/ui-contexts@16.0.0-rc.1
  - @rocket.chat/ui-avatar@12.0.0-rc.1
  - @rocket.chat/ui-video-conf@16.0.0-rc.1

  </details>

## 16.0.0-rc.0

### Patch Changes

- ([#35120](https://github.com/RocketChat/Rocket.Chat/pull/35120)) Fixes behavior of app updates that would save undesired field changes to documents

- ([#33141](https://github.com/RocketChat/Rocket.Chat/pull/33141)) Fixes an issue where video conf message block wasn't considering display avatars preference

- <details><summary>Updated dependencies [89964144e042c8d9282b51efd89e1e684077fdd7, 2921a6aa6f7c971a29c8209574cfb66432bc9f47, 083fc49cf718e460dd6e8fcd72b98b42aeb6fc86, f85da08765a9d3f8c5aabd9291fd08be6dfdeb85, 271894fb3942d5d0ce3d669325d07fbbbc4bf112, 697a38d23590ac799f0f3c14a676fb6bea7e86ea, be5031a21bdcda31270d53d319f7d183e77d84d7, 36e90a2eb2f9698f7ba42f6e8429a240114426bf]:</summary>
  - @rocket.chat/ui-video-conf@16.0.0-rc.0
  - @rocket.chat/core-typings@7.4.0-rc.0
  - @rocket.chat/apps-engine@1.49.0-rc.0
  - @rocket.chat/ui-contexts@16.0.0-rc.0
  - @rocket.chat/gazzodown@16.0.0-rc.0
  - @rocket.chat/ui-avatar@12.0.0-rc.0

  </details>

## 15.0.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.3.3
  - @rocket.chat/gazzodown@15.0.3
  - @rocket.chat/ui-contexts@15.0.3
  - @rocket.chat/ui-avatar@11.0.3
  - @rocket.chat/ui-video-conf@15.0.3

  </details>

## 15.0.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.3.2
  - @rocket.chat/gazzodown@15.0.2
  - @rocket.chat/ui-contexts@15.0.2
  - @rocket.chat/ui-avatar@11.0.2
  - @rocket.chat/ui-video-conf@15.0.2

  </details>

## 15.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.3.1
  - @rocket.chat/gazzodown@15.0.1
  - @rocket.chat/ui-contexts@15.0.1
  - @rocket.chat/ui-avatar@11.0.1
  - @rocket.chat/ui-video-conf@15.0.1

  </details>

## 15.0.0

### Patch Changes

- ([#34858](https://github.com/RocketChat/Rocket.Chat/pull/34858)) Fixes an issue that prevented the apps-engine from reestablishing communications with subprocesses in some cases

- <details><summary>Updated dependencies [5506c406f4a22145ece065ad2b797225e94423ca, 8942b0032af976738a7c602fa389803dda30c0dc, bfa92f4dba1a16973d7da5a9c0f5d0df998bf944, c0fa1c884cccab47f4e68dd81457c424cf176f11]:</summary>
  - @rocket.chat/apps-engine@1.48.2
  - @rocket.chat/ui-contexts@15.0.0
  - @rocket.chat/core-typings@7.3.0
  - @rocket.chat/gazzodown@15.0.0
  - @rocket.chat/ui-avatar@11.0.0
  - @rocket.chat/ui-video-conf@15.0.0

  </details>

## 15.0.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.3.0-rc.5
  - @rocket.chat/gazzodown@15.0.0-rc.5
  - @rocket.chat/ui-contexts@15.0.0-rc.5
  - @rocket.chat/ui-avatar@11.0.0-rc.5
  - @rocket.chat/ui-video-conf@15.0.0-rc.5

  </details>

## 15.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.3.0-rc.4
  - @rocket.chat/gazzodown@15.0.0-rc.4
  - @rocket.chat/ui-contexts@15.0.0-rc.4
  - @rocket.chat/ui-avatar@11.0.0-rc.4
  - @rocket.chat/ui-video-conf@15.0.0-rc.4

  </details>

## 15.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.3.0-rc.3
  - @rocket.chat/gazzodown@15.0.0-rc.3
  - @rocket.chat/ui-contexts@15.0.0-rc.3
  - @rocket.chat/ui-avatar@11.0.0-rc.3
  - @rocket.chat/ui-video-conf@15.0.0-rc.3

  </details>

## 15.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.3.0-rc.2
  - @rocket.chat/gazzodown@15.0.0-rc.2
  - @rocket.chat/ui-contexts@15.0.0-rc.2
  - @rocket.chat/ui-avatar@11.0.0-rc.2
  - @rocket.chat/ui-video-conf@15.0.0-rc.2

  </details>

## 15.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.3.0-rc.1
  - @rocket.chat/gazzodown@15.0.0-rc.1
  - @rocket.chat/ui-contexts@15.0.0-rc.1
  - @rocket.chat/ui-avatar@11.0.0-rc.1
  - @rocket.chat/ui-video-conf@15.0.0-rc.1

  </details>

## 15.0.0-rc.0

### Patch Changes

- ([#34858](https://github.com/RocketChat/Rocket.Chat/pull/34858)) Fixes an issue that prevented the apps-engine from reestablishing communications with subprocesses in some cases

- <details><summary>Updated dependencies [5506c406f4a22145ece065ad2b797225e94423ca, 8942b0032af976738a7c602fa389803dda30c0dc, bfa92f4dba1a16973d7da5a9c0f5d0df998bf944]:</summary>
  - @rocket.chat/apps-engine@1.48.2-rc.0
  - @rocket.chat/ui-contexts@15.0.0-rc.0
  - @rocket.chat/core-typings@7.3.0-rc.0
  - @rocket.chat/gazzodown@15.0.0-rc.0
  - @rocket.chat/ui-avatar@11.0.0-rc.0
  - @rocket.chat/ui-video-conf@15.0.0-rc.0

  </details>

## 14.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.2.1
  - @rocket.chat/gazzodown@14.0.1
  - @rocket.chat/ui-contexts@14.0.1
  - @rocket.chat/ui-avatar@10.0.1
  - @rocket.chat/ui-video-conf@14.0.1

  </details>

## 14.0.0

### Patch Changes

- ([#34205](https://github.com/RocketChat/Rocket.Chat/pull/34205)) Fixes an error where the engine would not retry a subprocess restart if the last attempt failed

- ([#34858](https://github.com/RocketChat/Rocket.Chat/pull/34858)) Fixes an issue that prevented the apps-engine from reestablishing communications with subprocesses in some cases

- ([#34205](https://github.com/RocketChat/Rocket.Chat/pull/34205)) Fixes error propagation when trying to get the status of apps in some cases

- ([#34205](https://github.com/RocketChat/Rocket.Chat/pull/34205)) Fixes wrong data being reported to total failed apps metrics and statistics

- <details><summary>Updated dependencies [76f6239ff1a9f34f163c03c140c4ceba62563b4e, eb794b7fd6bf3ff5a37a38bccaba247ed36db744, c43220dcd8c1df86a6143d6553964ad2173903b3, f62326080d5e6ba36351cb0b6965a09f23856ac8, 76f6239ff1a9f34f163c03c140c4ceba62563b4e, f62326080d5e6ba36351cb0b6965a09f23856ac8, 475120dc19fb8cc400fd8af21559cd6f3cc17eb8, 2e4af86f6463166ba4d0b37b153b89ab246e112a, 76f6239ff1a9f34f163c03c140c4ceba62563b4e, f62326080d5e6ba36351cb0b6965a09f23856ac8, 75a14b2e013aca7361cac56316f2b7e8c07d9dc8, f62326080d5e6ba36351cb0b6965a09f23856ac8]:</summary>
  - @rocket.chat/ui-video-conf@14.0.0
  - @rocket.chat/core-typings@7.2.0
  - @rocket.chat/apps-engine@1.48.1
  - @rocket.chat/ui-contexts@14.0.0
  - @rocket.chat/gazzodown@14.0.0
  - @rocket.chat/ui-avatar@10.0.0

  </details>

## 14.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.2.0-rc.3
  - @rocket.chat/gazzodown@14.0.0-rc.3
  - @rocket.chat/ui-contexts@14.0.0-rc.3
  - @rocket.chat/ui-avatar@10.0.0-rc.3
  - @rocket.chat/ui-video-conf@14.0.0-rc.3

  </details>

## 14.0.0-rc.2

### Patch Changes

- ([#34858](https://github.com/RocketChat/Rocket.Chat/pull/34858)) Fixes an issue that prevented the apps-engine from reestablishing communications with subprocesses in some cases

- <details><summary>Updated dependencies [c43220dcd8c1df86a6143d6553964ad2173903b3]:</summary>
  - @rocket.chat/apps-engine@1.48.1-rc.1
  - @rocket.chat/ui-contexts@14.0.0-rc.2
  - @rocket.chat/core-typings@7.2.0-rc.2
  - @rocket.chat/gazzodown@14.0.0-rc.2
  - @rocket.chat/ui-avatar@10.0.0-rc.2
  - @rocket.chat/ui-video-conf@14.0.0-rc.2

  </details>

## 14.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.2.0-rc.1
  - @rocket.chat/gazzodown@14.0.0-rc.1
  - @rocket.chat/ui-contexts@14.0.0-rc.1
  - @rocket.chat/ui-avatar@10.0.0-rc.1
  - @rocket.chat/ui-video-conf@14.0.0-rc.1

  </details>

## 14.0.0-rc.0

### Patch Changes

- ([#34205](https://github.com/RocketChat/Rocket.Chat/pull/34205)) Fixes an error where the engine would not retry a subprocess restart if the last attempt failed

- ([#34205](https://github.com/RocketChat/Rocket.Chat/pull/34205)) Fixes error propagation when trying to get the status of apps in some cases

- ([#34205](https://github.com/RocketChat/Rocket.Chat/pull/34205)) Fixes wrong data being reported to total failed apps metrics and statistics

- <details><summary>Updated dependencies [76f6239ff1a9f34f163c03c140c4ceba62563b4e, eb794b7fd6bf3ff5a37a38bccaba247ed36db744, f62326080d5e6ba36351cb0b6965a09f23856ac8, 76f6239ff1a9f34f163c03c140c4ceba62563b4e, f62326080d5e6ba36351cb0b6965a09f23856ac8, 475120dc19fb8cc400fd8af21559cd6f3cc17eb8, 2e4af86f6463166ba4d0b37b153b89ab246e112a, 76f6239ff1a9f34f163c03c140c4ceba62563b4e, f62326080d5e6ba36351cb0b6965a09f23856ac8, 75a14b2e013aca7361cac56316f2b7e8c07d9dc8, f62326080d5e6ba36351cb0b6965a09f23856ac8]:</summary>
  - @rocket.chat/ui-video-conf@14.0.0-rc.0
  - @rocket.chat/core-typings@7.2.0-rc.0
  - @rocket.chat/apps-engine@1.48.1-rc.0
  - @rocket.chat/ui-contexts@14.0.0-rc.0
  - @rocket.chat/gazzodown@14.0.0-rc.0
  - @rocket.chat/ui-avatar@10.0.0-rc.0

  </details>

## 13.0.0

### Patch Changes

- <details><summary>Updated dependencies [82767d8fd8a52ac348e8aded1d238e688d36129b, 80e36bfc3938775eb26aa5576f1b9b98896e1cc4, 3569b0a9c48f8b94ebaef2f8b607c52fdb8e570a, b4841cb7206d855d7a1bc7604683a5b4a48b7176, 32d93a0666fa1cbe857d02889e93d9bbf45bd4f0, ce7024af36fcde97b1da5b2731f6edc4a4c236b8, d398866dba725918017e3609807f9d0ab9b89b72, d398866dba725918017e3609807f9d0ab9b89b72]:</summary>
  - @rocket.chat/apps-engine@1.48.0
  - @rocket.chat/core-typings@7.1.0
  - @rocket.chat/gazzodown@13.0.0
  - @rocket.chat/ui-contexts@13.0.0
  - @rocket.chat/ui-avatar@9.0.0
  - @rocket.chat/ui-video-conf@13.0.0

  </details>

## 13.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.1.0-rc.3
  - @rocket.chat/gazzodown@13.0.0-rc.3
  - @rocket.chat/ui-contexts@13.0.0-rc.3
  - @rocket.chat/ui-avatar@9.0.0-rc.3
  - @rocket.chat/ui-video-conf@13.0.0-rc.3

  </details>

## 13.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.1.0-rc.2
  - @rocket.chat/gazzodown@13.0.0-rc.2
  - @rocket.chat/ui-contexts@13.0.0-rc.2
  - @rocket.chat/ui-avatar@9.0.0-rc.2
  - @rocket.chat/ui-video-conf@13.0.0-rc.2

  </details>

## 13.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.1.0-rc.1
  - @rocket.chat/gazzodown@13.0.0-rc.1
  - @rocket.chat/ui-contexts@13.0.0-rc.1
  - @rocket.chat/ui-avatar@9.0.0-rc.1
  - @rocket.chat/ui-video-conf@13.0.0-rc.1

  </details>

## 13.0.0-rc.0

### Patch Changes

- <details><summary>Updated dependencies [82767d8fd8a52ac348e8aded1d238e688d36129b, 80e36bfc3938775eb26aa5576f1b9b98896e1cc4, 3569b0a9c48f8b94ebaef2f8b607c52fdb8e570a, b4841cb7206d855d7a1bc7604683a5b4a48b7176, 32d93a0666fa1cbe857d02889e93d9bbf45bd4f0, ce7024af36fcde97b1da5b2731f6edc4a4c236b8, d398866dba725918017e3609807f9d0ab9b89b72, d398866dba725918017e3609807f9d0ab9b89b72]:</summary>
  - @rocket.chat/apps-engine@1.48.0-rc.0
  - @rocket.chat/core-typings@7.1.0-rc.0
  - @rocket.chat/gazzodown@13.0.0-rc.0
  - @rocket.chat/ui-contexts@13.0.0-rc.0
  - @rocket.chat/ui-avatar@9.0.0-rc.0
  - @rocket.chat/ui-video-conf@13.0.0-rc.0

  </details>

## 12.0.0

### Minor Changes

- ([#33592](https://github.com/RocketChat/Rocket.Chat/pull/33592)) Adds ability to collapse/expand sidebar groups

### Patch Changes

- <details><summary>Updated dependencies [687f1efd5f, bcacbb1cee, 9274cf4586, b338807d76, 5f9826bed6, debd3ffa22, a5f25e73b5, 3ea02d3cc1, e3629e065b, 03d148524b, 81998f3450, 509143d6dd]:</summary>
  - @rocket.chat/ui-kit@0.37.0
  - @rocket.chat/core-typings@7.0.0
  - @rocket.chat/ui-video-conf@12.0.0
  - @rocket.chat/gazzodown@12.0.0
  - @rocket.chat/ui-avatar@8.0.0
  - @rocket.chat/apps-engine@1.47.0
  - @rocket.chat/ui-contexts@12.0.0

  </details>

## 12.0.0-rc.6

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.0.0-rc.6
  - @rocket.chat/gazzodown@12.0.0-rc.6
  - @rocket.chat/ui-contexts@12.0.0-rc.6
  - @rocket.chat/ui-avatar@8.0.0-rc.6
  - @rocket.chat/ui-video-conf@12.0.0-rc.6

  </details>

## 12.0.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@12.0.0-rc.5
  - @rocket.chat/gazzodown@12.0.0-rc.5
  - @rocket.chat/ui-avatar@8.0.0-rc.5
  - @rocket.chat/ui-video-conf@12.0.0-rc.5
  - @rocket.chat/core-typings@7.0.0-rc.5

  </details>

## 12.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.0.0-rc.4
  - @rocket.chat/gazzodown@12.0.0-rc.4
  - @rocket.chat/ui-contexts@12.0.0-rc.4
  - @rocket.chat/ui-avatar@8.0.0-rc.4
  - @rocket.chat/ui-video-conf@12.0.0-rc.4

  </details>

## 12.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.0.0-rc.3
  - @rocket.chat/gazzodown@12.0.0-rc.3
  - @rocket.chat/ui-contexts@12.0.0-rc.3
  - @rocket.chat/ui-avatar@8.0.0-rc.3
  - @rocket.chat/ui-video-conf@12.0.0-rc.3

  </details>

## 12.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.0.0-rc.2
  - @rocket.chat/gazzodown@12.0.0-rc.2
  - @rocket.chat/ui-contexts@12.0.0-rc.2
  - @rocket.chat/ui-avatar@8.0.0-rc.2
  - @rocket.chat/ui-video-conf@12.0.0-rc.2

  </details>

## 12.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@7.0.0-rc.1
  - @rocket.chat/gazzodown@12.0.0-rc.1
  - @rocket.chat/ui-contexts@12.0.0-rc.1
  - @rocket.chat/ui-avatar@8.0.0-rc.1
  - @rocket.chat/ui-video-conf@12.0.0-rc.1

  </details>

## 12.0.0-rc.0

### Minor Changes

- ([#33592](https://github.com/RocketChat/Rocket.Chat/pull/33592)) Adds ability to collapse/expand sidebar groups

### Patch Changes

- <details><summary>Updated dependencies [7726d68374, 687f1efd5f, bcacbb1cee, 9274cf4586, b338807d76, 5f9826bed6, debd3ffa22, a5f25e73b5, 3ea02d3cc1, e3629e065b, 03d148524b, 81998f3450, 509143d6dd]:</summary>
  - @rocket.chat/core-typings@7.0.0-rc.0
  - @rocket.chat/ui-kit@0.37.0-rc.0
  - @rocket.chat/ui-video-conf@12.0.0-rc.0
  - @rocket.chat/gazzodown@12.0.0-rc.0
  - @rocket.chat/ui-avatar@8.0.0-rc.0
  - @rocket.chat/apps-engine@1.47.0-rc.0
  - @rocket.chat/ui-contexts@12.0.0-rc.0

  </details>

## 11.0.0

### Minor Changes

- ([#32821](https://github.com/RocketChat/Rocket.Chat/pull/32821)) Replaced new `SidebarV2` components under feature preview

### Patch Changes

- ([#33179](https://github.com/RocketChat/Rocket.Chat/pull/33179)) Fixed an error that incorrectly showed conference calls as not answered after they ended

- ([#32999](https://github.com/RocketChat/Rocket.Chat/pull/32999)) Fixes multiple selection for MultiStaticSelectElement in UiKit

- <details><summary>Updated dependencies [274f4f5881, cd0d50016e, 927710d778, 12d6307998]:</summary>
  - @rocket.chat/core-typings@6.13.0
  - @rocket.chat/ui-video-conf@11.0.0
  - @rocket.chat/gazzodown@11.0.0
  - @rocket.chat/ui-avatar@7.0.0
  - @rocket.chat/ui-contexts@11.0.0

  </details>

## 11.0.0-rc.6

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@6.13.0-rc.6
  - @rocket.chat/gazzodown@11.0.0-rc.6
  - @rocket.chat/ui-contexts@11.0.0-rc.6
  - @rocket.chat/ui-avatar@7.0.0-rc.6
  - @rocket.chat/ui-video-conf@11.0.0-rc.6

  </details>

## 11.0.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@6.13.0-rc.5
  - @rocket.chat/gazzodown@11.0.0-rc.5
  - @rocket.chat/ui-contexts@11.0.0-rc.5
  - @rocket.chat/ui-avatar@7.0.0-rc.5
  - @rocket.chat/ui-video-conf@11.0.0-rc.5

  </details>

## 11.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@6.13.0-rc.4
  - @rocket.chat/gazzodown@11.0.0-rc.4
  - @rocket.chat/ui-contexts@11.0.0-rc.4
  - @rocket.chat/ui-avatar@7.0.0-rc.4
  - @rocket.chat/ui-video-conf@11.0.0-rc.4

  </details>

## 11.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@6.13.0-rc.3
  - @rocket.chat/gazzodown@11.0.0-rc.3
  - @rocket.chat/ui-contexts@11.0.0-rc.3
  - @rocket.chat/ui-avatar@7.0.0-rc.3
  - @rocket.chat/ui-video-conf@11.0.0-rc.3

  </details>

## 11.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@6.13.0-rc.2
  - @rocket.chat/gazzodown@11.0.0-rc.2
  - @rocket.chat/ui-contexts@11.0.0-rc.2
  - @rocket.chat/ui-avatar@7.0.0-rc.2
  - @rocket.chat/ui-video-conf@11.0.0-rc.2

  </details>

## 11.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@11.0.0-rc.1
  - @rocket.chat/gazzodown@11.0.0-rc.1
  - @rocket.chat/ui-avatar@7.0.0-rc.1
  - @rocket.chat/ui-video-conf@11.0.0-rc.1
  - @rocket.chat/core-typings@6.13.0-rc.1

  </details>

## 11.0.0-rc.0

### Minor Changes

- ([#32821](https://github.com/RocketChat/Rocket.Chat/pull/32821)) Replaced new `SidebarV2` components under feature preview

### Patch Changes

- ([#33179](https://github.com/RocketChat/Rocket.Chat/pull/33179)) Fixed an error that incorrectly showed conference calls as not answered after they ended

- ([#32999](https://github.com/RocketChat/Rocket.Chat/pull/32999)) Fixes multiple selection for MultiStaticSelectElement in UiKit

- <details><summary>Updated dependencies [274f4f5881, cd0d50016e, 927710d778, 12d6307998]:</summary>
  - @rocket.chat/core-typings@6.13.0-rc.0
  - @rocket.chat/ui-video-conf@11.0.0-rc.0
  - @rocket.chat/gazzodown@11.0.0-rc.0
  - @rocket.chat/ui-avatar@7.0.0-rc.0
  - @rocket.chat/ui-contexts@11.0.0-rc.0

  </details>

## 10.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@6.12.1
  - @rocket.chat/gazzodown@10.0.1
  - @rocket.chat/ui-contexts@10.0.1
  - @rocket.chat/ui-avatar@6.0.1
  - @rocket.chat/ui-video-conf@10.0.1

  </details>

## 10.0.0

### Patch Changes

- ([#32968](https://github.com/RocketChat/Rocket.Chat/pull/32968)) Bumped @rocket.chat/fuselage that fixes the Menu onPointerUp event behavior

- <details><summary>Updated dependencies [8ea6517c4e, c11f3722df, 7937ff741a, 58c0efc732, e28be46db7, 58c0efc732]:</summary>
  - @rocket.chat/ui-video-conf@10.0.0
  - @rocket.chat/gazzodown@10.0.0
  - @rocket.chat/ui-avatar@6.0.0
  - @rocket.chat/ui-kit@0.36.1
  - @rocket.chat/core-typings@6.12.0
  - @rocket.chat/ui-contexts@10.0.0

  </details>

## 10.0.0-rc.6

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@6.12.0-rc.6
  - @rocket.chat/gazzodown@10.0.0-rc.6
  - @rocket.chat/ui-contexts@10.0.0-rc.6
  - @rocket.chat/ui-avatar@6.0.0-rc.6
  - @rocket.chat/ui-video-conf@10.0.0-rc.6

  </details>

## 10.0.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@6.12.0-rc.5
  - @rocket.chat/gazzodown@10.0.0-rc.5
  - @rocket.chat/ui-contexts@10.0.0-rc.5
  - @rocket.chat/ui-avatar@6.0.0-rc.5
  - @rocket.chat/ui-video-conf@10.0.0-rc.5

  </details>

## 10.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@6.12.0-rc.4
  - @rocket.chat/gazzodown@10.0.0-rc.4
  - @rocket.chat/ui-contexts@10.0.0-rc.4
  - @rocket.chat/ui-avatar@6.0.0-rc.4
  - @rocket.chat/ui-video-conf@10.0.0-rc.4

  </details>

## 10.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@6.12.0-rc.3
  - @rocket.chat/gazzodown@10.0.0-rc.3
  - @rocket.chat/ui-contexts@10.0.0-rc.3
  - @rocket.chat/ui-avatar@6.0.0-rc.3
  - @rocket.chat/ui-video-conf@10.0.0-rc.3
  </details>

## 10.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@6.12.0-rc.2
  - @rocket.chat/gazzodown@10.0.0-rc.2
  - @rocket.chat/ui-contexts@10.0.0-rc.2
  - @rocket.chat/ui-avatar@6.0.0-rc.2
  - @rocket.chat/ui-video-conf@10.0.0-rc.2

  </details>

## 10.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@6.12.0-rc.1
  - @rocket.chat/gazzodown@10.0.0-rc.1
  - @rocket.chat/ui-contexts@10.0.0-rc.1
  - @rocket.chat/ui-avatar@6.0.0-rc.1
  - @rocket.chat/ui-video-conf@10.0.0-rc.1

  </details>

## 10.0.0-rc.0

### Patch Changes

- ([#32968](https://github.com/RocketChat/Rocket.Chat/pull/32968)) Bumped @rocket.chat/fuselage that fixes the Menu onPointerUp event behavior

- <details><summary>Updated dependencies [8ea6517c4e, c11f3722df, 7937ff741a, 58c0efc732, e28be46db7, 58c0efc732]:</summary>
  - @rocket.chat/ui-video-conf@10.0.0-rc.0
  - @rocket.chat/gazzodown@10.0.0-rc.0
  - @rocket.chat/ui-avatar@6.0.0-rc.0
  - @rocket.chat/ui-kit@0.36.1-rc.0
  - @rocket.chat/core-typings@6.12.0-rc.0
  - @rocket.chat/ui-contexts@10.0.0-rc.0

  </details>

## 9.0.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@6.11.2
  - @rocket.chat/gazzodown@9.0.2
  - @rocket.chat/ui-contexts@9.0.2
  - @rocket.chat/ui-avatar@5.0.2
  - @rocket.chat/ui-video-conf@9.0.2

  </details>

## 9.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@6.11.1
  - @rocket.chat/gazzodown@9.0.1
  - @rocket.chat/ui-contexts@9.0.1
  - @rocket.chat/ui-avatar@5.0.1
  - @rocket.chat/ui-video-conf@9.0.1

  </details>

## 9.0.0

### Patch Changes

- ([#32679](https://github.com/RocketChat/Rocket.Chat/pull/32679)) Fix validations from "UiKit" modal component

- ([#32719](https://github.com/RocketChat/Rocket.Chat/pull/32719)) Added the `user` param to apps-engine update method call, allowing apps' new `onUpdate` hook to know who triggered the update.

- <details><summary>Updated dependencies [2d89a0c448, 24f7df4894, 4e8aa575a6, b8e5887fb9]:</summary>
  - @rocket.chat/ui-video-conf@9.0.0
  - @rocket.chat/core-typings@6.11.0
  - @rocket.chat/ui-contexts@9.0.0
  - @rocket.chat/ui-kit@0.36.0
  - @rocket.chat/gazzodown@9.0.0
  - @rocket.chat/ui-avatar@5.0.0

  </details>

## 9.0.0-rc.6

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@6.11.0-rc.6
  - @rocket.chat/gazzodown@9.0.0-rc.6
  - @rocket.chat/ui-contexts@9.0.0-rc.6
  - @rocket.chat/ui-avatar@5.0.0-rc.6
  - @rocket.chat/ui-video-conf@9.0.0-rc.6

  </details>

## 9.0.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@6.11.0-rc.5
  - @rocket.chat/gazzodown@9.0.0-rc.5
  - @rocket.chat/ui-contexts@9.0.0-rc.5
  - @rocket.chat/ui-avatar@5.0.0-rc.5
  - @rocket.chat/ui-video-conf@9.0.0-rc.5

  </details>

## 9.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@6.11.0-rc.4
  - @rocket.chat/gazzodown@9.0.0-rc.4
  - @rocket.chat/ui-contexts@9.0.0-rc.4
  - @rocket.chat/ui-avatar@5.0.0-rc.4
  - @rocket.chat/ui-video-conf@9.0.0-rc.4

  </details>

## 9.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@6.11.0-rc.3
  - @rocket.chat/gazzodown@9.0.0-rc.3
  - @rocket.chat/ui-contexts@9.0.0-rc.3
  - @rocket.chat/ui-avatar@5.0.0-rc.3
  - @rocket.chat/ui-video-conf@9.0.0-rc.3

  </details>

## 9.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@6.11.0-rc.2
  - @rocket.chat/gazzodown@9.0.0-rc.2
  - @rocket.chat/ui-contexts@9.0.0-rc.2
  - @rocket.chat/ui-avatar@5.0.0-rc.2
  - @rocket.chat/ui-video-conf@9.0.0-rc.2

  </details>

## 9.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@6.11.0-rc.1
  - @rocket.chat/gazzodown@9.0.0-rc.1
  - @rocket.chat/ui-contexts@9.0.0-rc.1
  - @rocket.chat/ui-avatar@5.0.0-rc.1
  - @rocket.chat/ui-video-conf@9.0.0-rc.1

  </details>

## 9.0.0-rc.0

### Patch Changes

- ([#32679](https://github.com/RocketChat/Rocket.Chat/pull/32679)) Fix validations from "UiKit" modal component

- ([#32719](https://github.com/RocketChat/Rocket.Chat/pull/32719)) Added the `user` param to apps-engine update method call, allowing apps' new `onUpdate` hook to know who triggered the update.

- <details><summary>Updated dependencies [2d89a0c448, 24f7df4894, 4e8aa575a6, b8e5887fb9]:</summary>
  - @rocket.chat/ui-video-conf@9.0.0-rc.0
  - @rocket.chat/core-typings@6.11.0-rc.0
  - @rocket.chat/ui-contexts@9.0.0-rc.0
  - @rocket.chat/ui-kit@0.36.0-rc.0
  - @rocket.chat/gazzodown@9.0.0-rc.0
  - @rocket.chat/ui-avatar@5.0.0-rc.0

  </details>

## 8.0.2

### Patch Changes

- ([#32935](https://github.com/RocketChat/Rocket.Chat/pull/32935)) Fixed an issue that prevented apps from being updated or uninstalled in some cases

- ([#32935](https://github.com/RocketChat/Rocket.Chat/pull/32935)) Fixed an issue that prevented apps from handling errors during execution in some cases

- ([#32935](https://github.com/RocketChat/Rocket.Chat/pull/32935)) Improved Apps-Engine installation to prevent start up errors on manual installation setups

- ([#32935](https://github.com/RocketChat/Rocket.Chat/pull/32935)) Fixed an issue that caused the video conference button on rooms to not recognize a video conference provider app in some cases

- <details><summary>Updated dependencies [ca6a9d8de8, ca6a9d8de8, ca6a9d8de8, ca6a9d8de8]:</summary>
  - @rocket.chat/core-typings@6.10.2
  - @rocket.chat/gazzodown@8.0.2
  - @rocket.chat/ui-contexts@8.0.2
  - @rocket.chat/ui-avatar@4.0.2
  - @rocket.chat/ui-video-conf@8.0.2

  </details>

## 8.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@6.10.1
  - @rocket.chat/gazzodown@8.0.1
  - @rocket.chat/ui-contexts@8.0.1
  - @rocket.chat/ui-avatar@4.0.1
  - @rocket.chat/ui-video-conf@8.0.1

  </details>

## 8.0.0

### Minor Changes

- ([#31455](https://github.com/RocketChat/Rocket.Chat/pull/31455)) Introduced new elements for apps to select users

- ([#31821](https://github.com/RocketChat/Rocket.Chat/pull/31821)) New runtime for apps in the Apps-Engine based on the Deno platform

### Patch Changes

- <details><summary>Updated dependencies [a565999ae0, 1240c874a5, 59df102d0c, 5f95c4ec6b, f75a2cb4bb, 4f72d62aa7, dfa49bdbb2]:</summary>
  - @rocket.chat/ui-kit@0.35.0
  - @rocket.chat/core-typings@6.10.0
  - @rocket.chat/gazzodown@8.0.0
  - @rocket.chat/ui-video-conf@8.0.0
  - @rocket.chat/ui-contexts@8.0.0
  - @rocket.chat/ui-avatar@4.0.0

  </details>

## 8.0.0-rc.7

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@6.10.0-rc.7
  - @rocket.chat/gazzodown@8.0.0-rc.7
  - @rocket.chat/ui-contexts@8.0.0-rc.7
  - @rocket.chat/ui-avatar@4.0.0-rc.7
  - @rocket.chat/ui-video-conf@8.0.0-rc.7

  </details>

## 8.0.0-rc.6

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@6.10.0-rc.6
  - @rocket.chat/gazzodown@8.0.0-rc.6
  - @rocket.chat/ui-contexts@8.0.0-rc.6
  - @rocket.chat/ui-avatar@4.0.0-rc.6
  - @rocket.chat/ui-video-conf@8.0.0-rc.6

  </details>

## 8.0.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@6.10.0-rc.5
  - @rocket.chat/gazzodown@8.0.0-rc.5
  - @rocket.chat/ui-contexts@8.0.0-rc.5
  - @rocket.chat/ui-avatar@4.0.0-rc.5
  - @rocket.chat/ui-video-conf@8.0.0-rc.5

  </details>

## 8.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@6.10.0-rc.4
  - @rocket.chat/gazzodown@8.0.0-rc.4
  - @rocket.chat/ui-contexts@8.0.0-rc.4
  - @rocket.chat/ui-avatar@4.0.0-rc.4
  - @rocket.chat/ui-video-conf@8.0.0-rc.4

  </details>

## 8.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@6.10.0-rc.3
  - @rocket.chat/gazzodown@8.0.0-rc.3
  - @rocket.chat/ui-contexts@8.0.0-rc.3
  - @rocket.chat/ui-avatar@4.0.0-rc.3
  - @rocket.chat/ui-video-conf@8.0.0-rc.3

  </details>

## 8.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@6.10.0-rc.2
  - @rocket.chat/gazzodown@8.0.0-rc.2
  - @rocket.chat/ui-contexts@8.0.0-rc.2
  - @rocket.chat/ui-avatar@4.0.0-rc.2
  - @rocket.chat/ui-video-conf@8.0.0-rc.2

  </details>

## 8.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@6.10.0-rc.1
  - @rocket.chat/gazzodown@8.0.0-rc.1
  - @rocket.chat/ui-contexts@8.0.0-rc.1
  - @rocket.chat/ui-avatar@4.0.0-rc.1
  - @rocket.chat/ui-video-conf@8.0.0-rc.1

  </details>

## 8.0.0-rc.0

### Minor Changes

- ([#31455](https://github.com/RocketChat/Rocket.Chat/pull/31455)) Introduced new elements for apps to select users

- ([#31821](https://github.com/RocketChat/Rocket.Chat/pull/31821)) New runtime for apps in the Apps-Engine based on the Deno platform

### Patch Changes

- <details><summary>Updated dependencies [a565999ae0, 1240c874a5, 59df102d0c, 5f95c4ec6b, f75a2cb4bb, 4f72d62aa7, dfa49bdbb2]:</summary>
  - @rocket.chat/ui-kit@0.35.0-rc.0
  - @rocket.chat/core-typings@6.10.0-rc.0
  - @rocket.chat/gazzodown@8.0.0-rc.0
  - @rocket.chat/ui-video-conf@8.0.0-rc.0
  - @rocket.chat/ui-contexts@8.0.0-rc.0
  - @rocket.chat/ui-avatar@4.0.0-rc.0

## 7.0.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@6.9.3
  - @rocket.chat/gazzodown@7.0.3
  - @rocket.chat/ui-contexts@7.0.3
  - @rocket.chat/ui-avatar@3.0.3
  - @rocket.chat/ui-video-conf@7.0.3

  </details>

## 7.0.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@6.9.2
  - @rocket.chat/gazzodown@7.0.2
  - @rocket.chat/ui-contexts@7.0.2
  - @rocket.chat/ui-avatar@3.0.2
  - @rocket.chat/ui-video-conf@7.0.2

  </details>

## 7.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@6.9.1
  - @rocket.chat/gazzodown@7.0.1
  - @rocket.chat/ui-contexts@7.0.1
  - @rocket.chat/ui-avatar@3.0.1
  - @rocket.chat/ui-video-conf@7.0.1

  </details>

## 7.0.0

### Minor Changes

- ([#31918](https://github.com/RocketChat/Rocket.Chat/pull/31918)) Introduced new elements for apps to select channels

### Patch Changes

- ([#32327](https://github.com/RocketChat/Rocket.Chat/pull/32327)) Fix translation param on video conf joined message

- <details><summary>Updated dependencies [ff4e396416, ee5cdfc367, 70ab2a7b7b]:</summary>
  - @rocket.chat/core-typings@6.9.0
  - @rocket.chat/ui-kit@0.34.0
  - @rocket.chat/gazzodown@7.0.0
  - @rocket.chat/ui-contexts@7.0.0
  - @rocket.chat/ui-avatar@3.0.0
  - @rocket.chat/ui-video-conf@7.0.0

  </details>

## 7.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@6.9.0-rc.2
  - @rocket.chat/gazzodown@7.0.0-rc.2
  - @rocket.chat/ui-contexts@7.0.0-rc.2
  - @rocket.chat/ui-avatar@3.0.0-rc.2
  - @rocket.chat/ui-video-conf@7.0.0-rc.2

  </details>

## 7.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/core-typings@6.9.0-rc.1
  - @rocket.chat/gazzodown@7.0.0-rc.1
  - @rocket.chat/ui-contexts@7.0.0-rc.1
  - @rocket.chat/ui-avatar@3.0.0-rc.1
  - @rocket.chat/ui-video-conf@7.0.0-rc.1

  </details>

## 7.0.0-rc.0

### Minor Changes

- ([#31918](https://github.com/RocketChat/Rocket.Chat/pull/31918)) Introduced new elements for apps to select channels

### Patch Changes

- ([#32327](https://github.com/RocketChat/Rocket.Chat/pull/32327)) Fix translation param on video conf joined message

- <details><summary>Updated dependencies [ff4e396416, ee5cdfc367, 70ab2a7b7b]:</summary>
  - @rocket.chat/core-typings@6.9.0-rc.0
  - @rocket.chat/ui-kit@0.34.0-rc.0
  - @rocket.chat/gazzodown@7.0.0-rc.0
  - @rocket.chat/ui-contexts@7.0.0-rc.0
  - @rocket.chat/ui-avatar@3.0.0-rc.0
  - @rocket.chat/ui-video-conf@7.0.0-rc.0

  </details>

## 6.0.0

### Patch Changes

- ([#32374](https://github.com/RocketChat/Rocket.Chat/pull/32374)) Fixed an issue with some apps that didn't implement executeViewCloseHandler. This causes opened modals to be open forever on UI (unless Esc was clicked). This is because when the UI attempts to close it, it calls the aforementioned handler, and since it didn't exist, apps engine errored out.

  This returned an empty response to the UI, which ignored the response and continued to show the view.

- <details><summary>Updated dependencies [b7f5035442, c0d54d742a]:</summary>
  - @rocket.chat/eslint-config@0.7.0
  - @rocket.chat/ui-contexts@6.0.0
  - @rocket.chat/gazzodown@6.0.0
  - @rocket.chat/ui-kit@0.33.0
  - @rocket.chat/ui-video-conf@6.0.0
  - @rocket.chat/ui-avatar@2.0.0

  </details>

## 6.0.0-rc.2

### Patch Changes

- ([#32374](https://github.com/RocketChat/Rocket.Chat/pull/32374)) Fixed an issue with some apps that didn't implement executeViewCloseHandler. This causes opened modals to be open forever on UI (unless Esc was clicked). This is because when the UI attempts to close it, it calls the aforementioned handler, and since it didn't exist, apps engine errored out.

  This returned an empty response to the UI, which ignored the response and continued to show the view.

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/gazzodown@6.0.0-rc.2
  - @rocket.chat/ui-contexts@6.0.0-rc.2
  - @rocket.chat/ui-avatar@2.0.0-rc.2
  - @rocket.chat/ui-video-conf@6.0.0-rc.2

  </details>

## 6.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/gazzodown@6.0.0-rc.1
  - @rocket.chat/ui-contexts@6.0.0-rc.1
  - @rocket.chat/ui-avatar@2.0.0-rc.1
  - @rocket.chat/ui-video-conf@6.0.0-rc.1

  </details>

## 6.0.0-rc.0

### Patch Changes

- <details><summary>Updated dependencies [b7f5035442, c0d54d742a]:</summary>
  - @rocket.chat/eslint-config@0.7.0-rc.0
  - @rocket.chat/ui-contexts@6.0.0-rc.0
  - @rocket.chat/gazzodown@6.0.0-rc.0
  - @rocket.chat/ui-kit@0.33.0
  - @rocket.chat/ui-video-conf@6.0.0-rc.0
  - @rocket.chat/ui-avatar@2.0.0-rc.0

## 5.0.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/gazzodown@5.0.2
  - @rocket.chat/ui-contexts@5.0.2
  - @rocket.chat/ui-avatar@1.0.2
  - @rocket.chat/ui-video-conf@5.0.2
  </details>

## 5.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/gazzodown@5.0.1
  - @rocket.chat/ui-contexts@5.0.1
  - @rocket.chat/ui-avatar@1.0.1
  - @rocket.chat/ui-video-conf@5.0.1

  </details>

## 5.0.0

### Patch Changes

- <details><summary>Updated dependencies [7ac473df7a]:</summary>
  - @rocket.chat/eslint-config@0.6.2
  - @rocket.chat/gazzodown@5.0.0
  - @rocket.chat/ui-contexts@5.0.0
  - @rocket.chat/ui-kit@0.33.0
  - @rocket.chat/ui-video-conf@5.0.0
  - @rocket.chat/ui-avatar@1.0.0

  </details>

## 5.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/gazzodown@5.0.0-rc.4
  - @rocket.chat/ui-contexts@5.0.0-rc.4
  - @rocket.chat/ui-avatar@1.0.0-rc.4
  - @rocket.chat/ui-video-conf@5.0.0-rc.4

  </details>

## 5.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/gazzodown@5.0.0-rc.3
  - @rocket.chat/ui-contexts@5.0.0-rc.3
  - @rocket.chat/ui-avatar@1.0.0-rc.3
  - @rocket.chat/ui-video-conf@5.0.0-rc.3

  </details>

## 5.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/gazzodown@5.0.0-rc.2
  - @rocket.chat/ui-contexts@5.0.0-rc.2
  - @rocket.chat/ui-avatar@1.0.0-rc.2
  - @rocket.chat/ui-video-conf@5.0.0-rc.2

  </details>

## 5.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/gazzodown@5.0.0-rc.1
  - @rocket.chat/ui-contexts@5.0.0-rc.1
  - @rocket.chat/ui-avatar@1.0.0-rc.1
  - @rocket.chat/ui-video-conf@5.0.0-rc.1

  </details>

## 5.0.0-rc.0

### Patch Changes

- <details><summary>Updated dependencies [7ac473df7a]:</summary>
  - @rocket.chat/eslint-config@0.6.2-rc.0
  - @rocket.chat/gazzodown@5.0.0-rc.0
  - @rocket.chat/ui-contexts@5.0.0-rc.0
  - @rocket.chat/ui-kit@0.33.0
  - @rocket.chat/ui-video-conf@5.0.0-rc.0
  - @rocket.chat/ui-avatar@1.0.0-rc.0

  </details>

## 4.0.6

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/gazzodown@4.0.6
  - @rocket.chat/ui-contexts@4.0.6
  - @rocket.chat/ui-video-conf@4.0.6

  </details>

## 4.0.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@4.0.5
  - @rocket.chat/gazzodown@4.0.5
  - @rocket.chat/ui-video-conf@4.0.5

  </details>

## 4.0.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/gazzodown@4.0.4
  - @rocket.chat/ui-contexts@4.0.4
  - @rocket.chat/ui-video-conf@4.0.4

  </details>

## 4.0.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/gazzodown@4.0.3
  - @rocket.chat/ui-contexts@4.0.3
  - @rocket.chat/ui-video-conf@4.0.3

  </details>

## 4.0.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@4.0.2
  - @rocket.chat/gazzodown@4.0.2
  - @rocket.chat/ui-video-conf@4.0.2

  </details>

## 4.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/gazzodown@4.0.1
  - @rocket.chat/ui-contexts@4.0.1
  - @rocket.chat/ui-video-conf@4.0.1

  </details>

## 4.0.0

### Patch Changes

- ([#31138](https://github.com/RocketChat/Rocket.Chat/pull/31138)) feat(uikit): Move `@rocket.chat/ui-kit` package to the main monorepo

- <details><summary>Updated dependencies [642745f289, b223cbde14, b2b0035162, dbb08ef948]:</summary>
  - @rocket.chat/eslint-config@0.6.1
  - @rocket.chat/ui-kit@0.33.0
  - @rocket.chat/ui-video-conf@4.0.0
  - @rocket.chat/ui-contexts@4.0.0
  - @rocket.chat/gazzodown@4.0.0

  </details>

## 4.0.0-rc.7

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/gazzodown@4.0.0-rc.7
  - @rocket.chat/ui-contexts@4.0.0-rc.7
  - @rocket.chat/ui-video-conf@4.0.0-rc.7

  </details>

## 4.0.0-rc.6

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/gazzodown@4.0.0-rc.6
  - @rocket.chat/ui-contexts@4.0.0-rc.6
  - @rocket.chat/ui-video-conf@4.0.0-rc.6

  </details>

## 4.0.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/gazzodown@4.0.0-rc.5
  - @rocket.chat/ui-contexts@4.0.0-rc.5
  - @rocket.chat/ui-video-conf@4.0.0-rc.5

  </details>

## 4.0.0-rc.4

### Patch Changes

- @rocket.chat/gazzodown@4.0.0-rc.4
- @rocket.chat/ui-contexts@4.0.0-rc.4
- @rocket.chat/ui-video-conf@4.0.0-rc.4

## 4.0.0-rc.3

### Patch Changes

- @rocket.chat/gazzodown@4.0.0-rc.3
- @rocket.chat/ui-contexts@4.0.0-rc.3
- @rocket.chat/ui-video-conf@4.0.0-rc.3

## 4.0.0-rc.2

### Patch Changes

- @rocket.chat/gazzodown@4.0.0-rc.2
- @rocket.chat/ui-contexts@4.0.0-rc.2
- @rocket.chat/ui-video-conf@4.0.0-rc.2

## 4.0.0-rc.1

### Patch Changes

- @rocket.chat/gazzodown@4.0.0-rc.1
- @rocket.chat/ui-contexts@4.0.0-rc.1
- @rocket.chat/ui-video-conf@4.0.0-rc.1

## 4.0.0-rc.0

### Patch Changes

- b223cbde14: feat(uikit): Move `@rocket.chat/ui-kit` package to the main monorepo
- Updated dependencies [642745f289]
- Updated dependencies [b223cbde14]
- Updated dependencies [b2b0035162]
- Updated dependencies [dbb08ef948]
  - @rocket.chat/eslint-config@0.6.1-rc.0
  - @rocket.chat/ui-kit@0.33.0-rc.0
  - @rocket.chat/ui-video-conf@4.0.0-rc.0
  - @rocket.chat/ui-contexts@4.0.0-rc.0
  - @rocket.chat/gazzodown@4.0.0-rc.0

## 3.0.3

### Patch Changes

- @rocket.chat/gazzodown@3.0.3
- @rocket.chat/ui-contexts@3.0.3
- @rocket.chat/ui-video-conf@3.0.3

## 3.0.2

### Patch Changes

- @rocket.chat/gazzodown@3.0.2
- @rocket.chat/ui-contexts@3.0.2
- @rocket.chat/ui-video-conf@3.0.2

## 3.0.1

### Patch Changes

- @rocket.chat/ui-contexts@3.0.1
- @rocket.chat/gazzodown@3.0.1
- @rocket.chat/ui-video-conf@3.0.1

## 3.0.0

### Patch Changes

- Updated dependencies [7da1edf866]
- Updated dependencies [c2f337664e]
  - @rocket.chat/ui-contexts@3.0.0
  - @rocket.chat/gazzodown@3.0.0
  - @rocket.chat/ui-video-conf@3.0.0

## 3.0.0-rc.19

### Patch Changes

- @rocket.chat/gazzodown@3.0.0-rc.19
- @rocket.chat/ui-contexts@3.0.0-rc.19
- @rocket.chat/ui-video-conf@3.0.0-rc.19

## 3.0.0-rc.18

### Patch Changes

- @rocket.chat/gazzodown@3.0.0-rc.18
- @rocket.chat/ui-contexts@3.0.0-rc.18
- @rocket.chat/ui-video-conf@3.0.0-rc.18

## 3.0.0-rc.17

### Patch Changes

- @rocket.chat/gazzodown@3.0.0-rc.17
- @rocket.chat/ui-contexts@3.0.0-rc.17
- @rocket.chat/ui-video-conf@3.0.0-rc.17

## 3.0.0-rc.16

### Patch Changes

- @rocket.chat/gazzodown@3.0.0-rc.16
- @rocket.chat/ui-contexts@3.0.0-rc.16
- @rocket.chat/ui-video-conf@3.0.0-rc.16

## 3.0.0-rc.15

### Patch Changes

- @rocket.chat/gazzodown@3.0.0-rc.15
- @rocket.chat/ui-contexts@3.0.0-rc.15
- @rocket.chat/ui-video-conf@3.0.0-rc.15

## 3.0.0-rc.14

### Patch Changes

- @rocket.chat/gazzodown@3.0.0-rc.14
- @rocket.chat/ui-contexts@3.0.0-rc.14
- @rocket.chat/ui-video-conf@3.0.0-rc.14

## 3.0.0-rc.13

### Patch Changes

- @rocket.chat/gazzodown@3.0.0-rc.13
- @rocket.chat/ui-contexts@3.0.0-rc.13
- @rocket.chat/ui-video-conf@3.0.0-rc.13

## 3.0.0-rc.12

### Patch Changes

- @rocket.chat/gazzodown@3.0.0-rc.12
- @rocket.chat/ui-contexts@3.0.0-rc.12
- @rocket.chat/ui-video-conf@3.0.0-rc.12

## 3.0.0-rc.11

### Patch Changes

- @rocket.chat/gazzodown@3.0.0-rc.11
- @rocket.chat/ui-contexts@3.0.0-rc.11
- @rocket.chat/ui-video-conf@3.0.0-rc.11

## 3.0.0-rc.10

### Patch Changes

- @rocket.chat/gazzodown@3.0.0-rc.10
- @rocket.chat/ui-contexts@3.0.0-rc.10
- @rocket.chat/ui-video-conf@3.0.0-rc.10

## 3.0.0-rc.9

### Patch Changes

- @rocket.chat/gazzodown@3.0.0-rc.9
- @rocket.chat/ui-contexts@3.0.0-rc.9
- @rocket.chat/ui-video-conf@3.0.0-rc.9

## 3.0.0-rc.8

### Patch Changes

- @rocket.chat/gazzodown@3.0.0-rc.8
- @rocket.chat/ui-contexts@3.0.0-rc.8
- @rocket.chat/ui-video-conf@3.0.0-rc.8

## 3.0.0-rc.7

### Patch Changes

- @rocket.chat/gazzodown@3.0.0-rc.7
- @rocket.chat/ui-contexts@3.0.0-rc.7
- @rocket.chat/ui-video-conf@3.0.0-rc.7

## 3.0.0-rc.6

### Patch Changes

- @rocket.chat/gazzodown@3.0.0-rc.6
- @rocket.chat/ui-contexts@3.0.0-rc.6
- @rocket.chat/ui-video-conf@3.0.0-rc.6

## 3.0.0-rc.5

### Patch Changes

- @rocket.chat/gazzodown@3.0.0-rc.5
- @rocket.chat/ui-contexts@3.0.0-rc.5
- @rocket.chat/ui-video-conf@3.0.0-rc.5

## 3.0.0-rc.4

### Patch Changes

- @rocket.chat/gazzodown@3.0.0-rc.4
- @rocket.chat/ui-contexts@3.0.0-rc.4
- @rocket.chat/ui-video-conf@3.0.0-rc.4

## 3.0.0-rc.3

### Patch Changes

- @rocket.chat/gazzodown@3.0.0-rc.3
- @rocket.chat/ui-contexts@3.0.0-rc.3
- @rocket.chat/ui-video-conf@3.0.0-rc.3

## 3.0.0-rc.2

### Patch Changes

- @rocket.chat/gazzodown@3.0.0-rc.2
- @rocket.chat/ui-contexts@3.0.0-rc.2
- @rocket.chat/ui-video-conf@3.0.0-rc.2

## 3.0.0-rc.1

### Patch Changes

- @rocket.chat/gazzodown@3.0.0-rc.1
- @rocket.chat/ui-contexts@3.0.0-rc.1
- @rocket.chat/ui-video-conf@3.0.0-rc.1

## 3.0.0-rc.0

### Patch Changes

- Updated dependencies [7da1edf866]
- Updated dependencies [c2f337664e]
  - @rocket.chat/ui-contexts@3.0.0-rc.0
  - @rocket.chat/gazzodown@3.0.0-rc.0
  - @rocket.chat/ui-video-conf@3.0.0-rc.0

## 2.0.8

### Patch Changes

- @rocket.chat/gazzodown@2.0.8
- @rocket.chat/ui-contexts@2.0.8
- @rocket.chat/ui-video-conf@2.0.8

## 2.0.7

### Patch Changes

- @rocket.chat/gazzodown@2.0.7
- @rocket.chat/ui-contexts@2.0.7
- @rocket.chat/ui-video-conf@2.0.7

## 2.0.6

### Patch Changes

- @rocket.chat/gazzodown@2.0.6
- @rocket.chat/ui-contexts@2.0.6
- @rocket.chat/ui-video-conf@2.0.6

## 2.0.5

### Patch Changes

- @rocket.chat/gazzodown@2.0.5
- @rocket.chat/ui-contexts@2.0.5
- @rocket.chat/ui-video-conf@2.0.5

## 2.0.4

### Patch Changes

- @rocket.chat/gazzodown@2.0.4
- @rocket.chat/ui-contexts@2.0.4
- @rocket.chat/ui-video-conf@2.0.4

## 2.0.3

### Patch Changes

- @rocket.chat/gazzodown@2.0.3
- @rocket.chat/ui-contexts@2.0.3
- @rocket.chat/ui-video-conf@2.0.3

## 2.0.2

### Patch Changes

- @rocket.chat/gazzodown@2.0.2
- @rocket.chat/ui-contexts@2.0.2
- @rocket.chat/ui-video-conf@2.0.2

## 2.0.1

### Patch Changes

- @rocket.chat/gazzodown@2.0.1
- @rocket.chat/ui-contexts@2.0.1
- @rocket.chat/ui-video-conf@2.0.1

## 2.0.0

### Minor Changes

- 1246a21648: feat: Add missing variants to UIKit button
- f9a748526d: feat: Adding new UIKit components: Callout, Checkbox, Radio Button, Time Picker, Toast Bar, Toggle Switch, Tab Navigation

### Patch Changes

- dc1d8ce92e: feat(fuselage-ui-kit): Introduce `TabsNavigationBlock`
- dce4a829fa: Handle invalid context on `VideoConferenceBlock` component
- Updated dependencies [074db3b419]
- Updated dependencies [b8f3d5014f]
- Updated dependencies [0f56aacc4d]
  - @rocket.chat/ui-contexts@2.0.0
  - @rocket.chat/eslint-config@0.6.0
  - @rocket.chat/gazzodown@2.0.0
  - @rocket.chat/ui-video-conf@2.0.0

## 2.0.0-rc.5

### Patch Changes

- @rocket.chat/gazzodown@2.0.0-rc.5
- @rocket.chat/ui-contexts@2.0.0-rc.5
- @rocket.chat/ui-video-conf@2.0.0-rc.5

## 2.0.0-rc.4

### Patch Changes

- @rocket.chat/gazzodown@2.0.0-rc.4
- @rocket.chat/ui-contexts@2.0.0-rc.4
- @rocket.chat/ui-video-conf@2.0.0-rc.4

## 2.0.0-rc.3

### Patch Changes

- @rocket.chat/gazzodown@2.0.0-rc.3
- @rocket.chat/ui-contexts@2.0.0-rc.3
- @rocket.chat/ui-video-conf@2.0.0-rc.3

## 2.0.0-rc.2

### Patch Changes

- @rocket.chat/gazzodown@2.0.0-rc.2
- @rocket.chat/ui-contexts@2.0.0-rc.2
- @rocket.chat/ui-video-conf@2.0.0-rc.2

## 2.0.0-rc.1

### Patch Changes

- @rocket.chat/gazzodown@2.0.0-rc.1
- @rocket.chat/ui-contexts@2.0.0-rc.1
- @rocket.chat/ui-video-conf@2.0.0-rc.1

## 2.0.0-rc.0

### Minor Changes

- 1246a21648: feat: Add missing variants to UIKit button
- f9a748526d: feat: Adding new UIKit components: Callout, Checkbox, Radio Button, Time Picker, Toast Bar, Toggle Switch, Tab Navigation

### Patch Changes

- dc1d8ce92e: feat(fuselage-ui-kit): Introduce `TabsNavigationBlock`
- dce4a829fa: Handle invalid context on `VideoConferenceBlock` component
- Updated dependencies [074db3b419]
- Updated dependencies [b8f3d5014f]
- Updated dependencies [0f56aacc4d]
  - @rocket.chat/ui-contexts@2.0.0-rc.0
  - @rocket.chat/eslint-config@0.6.0-rc.0
  - @rocket.chat/gazzodown@2.0.0-rc.0
  - @rocket.chat/ui-video-conf@2.0.0-rc.0

## 1.0.8

### Patch Changes

- @rocket.chat/gazzodown@1.0.8
- @rocket.chat/ui-contexts@1.0.8
- @rocket.chat/ui-video-conf@1.0.8

## 1.0.7

### Patch Changes

- @rocket.chat/gazzodown@1.0.7
- @rocket.chat/ui-contexts@1.0.7
- @rocket.chat/ui-video-conf@1.0.7

## 1.0.6

### Patch Changes

- @rocket.chat/gazzodown@1.0.6
- @rocket.chat/ui-contexts@1.0.6
- @rocket.chat/ui-video-conf@1.0.6

## 1.0.5

### Patch Changes

- @rocket.chat/gazzodown@1.0.5
- @rocket.chat/ui-contexts@1.0.5
- @rocket.chat/ui-video-conf@1.0.5

## 1.0.4

### Patch Changes

- @rocket.chat/gazzodown@1.0.4
- @rocket.chat/ui-contexts@1.0.4
- @rocket.chat/ui-video-conf@1.0.4

## 1.0.3

### Patch Changes

- @rocket.chat/gazzodown@1.0.3
- @rocket.chat/ui-contexts@1.0.3
- @rocket.chat/ui-video-conf@1.0.3

## 1.0.2

### Patch Changes

- @rocket.chat/gazzodown@1.0.2
- @rocket.chat/ui-contexts@1.0.2
- @rocket.chat/ui-video-conf@1.0.2

## 1.0.1

### Patch Changes

- @rocket.chat/gazzodown@1.0.1
- @rocket.chat/ui-contexts@1.0.1
- @rocket.chat/ui-video-conf@1.0.1

## 1.0.0

### Minor Changes

- dbdf45b0e5: feat: Introduce contextualBar surface renderer for UiKit blocks
- c0fa567246: Introducing i18n to UiKit text renderers

### Patch Changes

- Updated dependencies [e14ec50816]
- Updated dependencies [9ea8088f06]
- Updated dependencies [e01bbcca54]
- Updated dependencies [f76d514341]
- Updated dependencies [cde2539619]
  - @rocket.chat/ui-contexts@1.0.0
  - @rocket.chat/gazzodown@1.0.0
  - @rocket.chat/ui-video-conf@1.0.0

## 1.0.0-rc.10

### Patch Changes

- @rocket.chat/ui-contexts@1.0.0-rc.10
- @rocket.chat/gazzodown@1.0.0-rc.10
- @rocket.chat/ui-video-conf@1.0.0-rc.10

## 1.0.0-rc.9

### Patch Changes

- @rocket.chat/gazzodown@1.0.0-rc.9
- @rocket.chat/ui-contexts@1.0.0-rc.9
- @rocket.chat/ui-video-conf@1.0.0-rc.9

## 1.0.0-rc.8

### Patch Changes

- @rocket.chat/gazzodown@1.0.0-rc.8
- @rocket.chat/ui-contexts@1.0.0-rc.8
- @rocket.chat/ui-video-conf@1.0.0-rc.8

## 1.0.0-rc.7

### Patch Changes

- @rocket.chat/gazzodown@1.0.0-rc.7
- @rocket.chat/ui-contexts@1.0.0-rc.7
- @rocket.chat/ui-video-conf@1.0.0-rc.7

## 1.0.0-rc.6

### Patch Changes

- @rocket.chat/gazzodown@1.0.0-rc.6
- @rocket.chat/ui-contexts@1.0.0-rc.6
- @rocket.chat/ui-video-conf@1.0.0-rc.6

## 1.0.0-rc.5

### Patch Changes

- @rocket.chat/gazzodown@1.0.0-rc.5
- @rocket.chat/ui-contexts@1.0.0-rc.5
- @rocket.chat/ui-video-conf@1.0.0-rc.5

## 1.0.0-rc.4

### Patch Changes

- @rocket.chat/gazzodown@1.0.0-rc.4
- @rocket.chat/ui-contexts@1.0.0-rc.4
- @rocket.chat/ui-video-conf@1.0.0-rc.4

## 1.0.0-rc.3

### Patch Changes

- @rocket.chat/gazzodown@1.0.0-rc.3
- @rocket.chat/ui-contexts@1.0.0-rc.3
- @rocket.chat/ui-video-conf@1.0.0-rc.3

## 1.0.0-rc.2

### Patch Changes

- Updated dependencies [f76d514341]
  - @rocket.chat/ui-contexts@1.0.0-rc.2
  - @rocket.chat/gazzodown@1.0.0-rc.2
  - @rocket.chat/ui-video-conf@1.0.0-rc.2

## 1.0.0-rc.1

### Patch Changes

- @rocket.chat/gazzodown@1.0.0-rc.1
- @rocket.chat/ui-contexts@1.0.0-rc.1
- @rocket.chat/ui-video-conf@1.0.0-rc.1

## 1.0.0-rc.0

### Minor Changes

- dbdf45b0e5: feat: Introduce contextualBar surface renderer for UiKit blocks
- c0fa567246: Introducing i18n to UiKit text renderers

### Patch Changes

- Updated dependencies [e14ec50816]
- Updated dependencies [9ea8088f06]
- Updated dependencies [e01bbcca54]
- Updated dependencies [cde2539619]
  - @rocket.chat/ui-contexts@1.0.0-rc.0
  - @rocket.chat/gazzodown@1.0.0-rc.0
  - @rocket.chat/ui-video-conf@1.0.0-rc.0

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.31.0](https://github.com/RocketChat/fuselage/compare/v0.30.1...v0.31.0) (2021-12-28)

### Bug Fixes

- **fuselage-ui-kit:** Initial Value being ignored on text input fields upon modal update ([#600](https://github.com/RocketChat/fuselage/issues/600)) ([d9bd704](https://github.com/RocketChat/fuselage/commit/d9bd704848eb9f2d9dd8b45f33cb8992ea39f9e2))
- docker image version ([8f181cf](https://github.com/RocketChat/fuselage/commit/8f181cf5a96084d7abd9ea94efd46cc50840c798))

### Features

- Message Preview ([#587](https://github.com/RocketChat/fuselage/issues/587)) ([e69dad3](https://github.com/RocketChat/fuselage/commit/e69dad3a6619e98ff70bcd1cb68567a159187336))
- **fuselage:** Replace typography of Message's user name and Banner's title ([#577](https://github.com/RocketChat/fuselage/issues/577)) ([6af2dba](https://github.com/RocketChat/fuselage/commit/6af2dbabc90d2e2f1598cbbd113ecc3ea82adfc0))
- New hooks for element size tracking ([#413](https://github.com/RocketChat/fuselage/issues/413)) ([8ca682c](https://github.com/RocketChat/fuselage/commit/8ca682c636d2e4813f7d346cb881513382be63cf))
- **fuselage:** Message preview component ([#553](https://github.com/RocketChat/fuselage/issues/553)) ([f8bd0ad](https://github.com/RocketChat/fuselage/commit/f8bd0ad637c0d2edad47b3c2384dac9c84e8d4fd))

## [0.30.1](https://github.com/RocketChat/fuselage/compare/v0.30.0...v0.30.1) (2021-10-20)

**Note:** Version bump only for package @rocket.chat/fuselage-ui-kit

# [0.30.0](https://github.com/RocketChat/fuselage/compare/v0.29.0...v0.30.0) (2021-10-06)

### Bug Fixes

- **fuselage:** Remove Field margin ([#543](https://github.com/RocketChat/fuselage/issues/543)) ([0cc10e1](https://github.com/RocketChat/fuselage/commit/0cc10e1b86bcf14a9ae590537a3d8e460b39b167))

# [0.29.0](https://github.com/RocketChat/fuselage/compare/v0.28.0...v0.29.0) (2021-08-31)

**Note:** Version bump only for package @rocket.chat/fuselage-ui-kit

# [0.28.0](https://github.com/RocketChat/fuselage/compare/v0.27.0...v0.28.0) (2021-07-30)

### Bug Fixes

- **fuselage-ui-kit:** Implements missing url prop for buttons ([#488](https://github.com/RocketChat/fuselage/issues/488)) ([bb19344](https://github.com/RocketChat/fuselage/commit/bb193441804c9b20174e2586d22c4b2845a486c3))

### Features

- **onboarding-ui:** Administrator information form and Organization information form ([#489](https://github.com/RocketChat/fuselage/issues/489)) ([b289f68](https://github.com/RocketChat/fuselage/commit/b289f68676954b91c792d8d97680314178bf2c60))
- styled API; monorepo grooming ([#482](https://github.com/RocketChat/fuselage/issues/482)) ([1b6b70c](https://github.com/RocketChat/fuselage/commit/1b6b70cf67ec16927b1566adc2350295a8927223))

# [0.27.0](https://github.com/RocketChat/fuselage/compare/v0.26.0...v0.27.0) (2021-06-28)

### Features

- ui-kit-unified ([#392](https://github.com/RocketChat/fuselage/issues/392)) ([ce48ca9](https://github.com/RocketChat/fuselage/commit/ce48ca9d9806283bba8be5df7c29c7aa8c1e716f))

# [0.26.0](https://github.com/RocketChat/fuselage/compare/v0.25.0...v0.26.0) (2021-05-28)

**Note:** Version bump only for package @rocket.chat/fuselage-ui-kit

# [0.25.0](https://github.com/RocketChat/fuselage/compare/v0.24.0...v0.25.0) (2021-05-19)

**Note:** Version bump only for package @rocket.chat/fuselage-ui-kit

# [0.24.0](https://github.com/RocketChat/fuselage/compare/v0.23.0...v0.24.0) (2021-04-28)

### Features

- [@rocket](https://github.com/rocket).chat/string-helpers ([#431](https://github.com/RocketChat/fuselage/issues/431)) ([2509d6a](https://github.com/RocketChat/fuselage/commit/2509d6acdbe5ec8b216e8d4430373797c5f5dfe2))

# [0.23.0](https://github.com/RocketChat/fuselage/compare/v0.22.0...v0.23.0) (2021-04-01)

### Bug Fixes

- **npm:** Wrong paths in "files" field of package.json ([6d3c811](https://github.com/RocketChat/fuselage/commit/6d3c811f6fd747de7f47aff145902d88476272ee))

### Features

- New icons ([#407](https://github.com/RocketChat/fuselage/issues/407)) ([9e708b4](https://github.com/RocketChat/fuselage/commit/9e708b42a0a3003669e1c5e76dce84b8ef563e21))

# [0.22.0](https://github.com/RocketChat/fuselage/compare/v0.21.0...v0.22.0) (2021-02-26)

**Note:** Version bump only for package @rocket.chat/fuselage-ui-kit

# [0.21.0](https://github.com/RocketChat/fuselage/compare/v0.20.3...v0.21.0) (2021-01-31)

### Bug Fixes

- Banner surface adjustments ([#362](https://github.com/RocketChat/fuselage/issues/362)) ([2d59b7c](https://github.com/RocketChat/fuselage/commit/2d59b7c41962f24aa13face91a9b9f0ea8f1718a))
- Pass appId and blockId from blocks to elements ([#366](https://github.com/RocketChat/fuselage/issues/366)) ([8a1b552](https://github.com/RocketChat/fuselage/commit/8a1b552f8dbc3a9b321d888f4a7e9dc9af2922cf))

### Features

- Built modules for design tokens ([#356](https://github.com/RocketChat/fuselage/issues/356)) ([f9c3449](https://github.com/RocketChat/fuselage/commit/f9c344953b8161a4385cab3a3dcc8b6a7210446f))
- linear_scale element ([#365](https://github.com/RocketChat/fuselage/issues/365)) ([43a4c54](https://github.com/RocketChat/fuselage/commit/43a4c54ed10d096ef2259ddcd30c3bbd97ae866a))

## [0.20.3](https://github.com/RocketChat/fuselage/compare/v0.20.2...v0.20.3) (2021-01-29)

**Note:** Version bump only for package @rocket.chat/fuselage-ui-kit

## [0.20.2](https://github.com/RocketChat/fuselage/compare/v0.20.1...v0.20.2) (2021-01-27)

**Note:** Version bump only for package @rocket.chat/fuselage-ui-kit

## [0.20.1](https://github.com/RocketChat/fuselage/compare/v0.20.0...v0.20.1) (2020-12-22)

**Note:** Version bump only for package @rocket.chat/fuselage-ui-kit

# [0.20.0](https://github.com/RocketChat/fuselage/compare/v0.19.0...v0.20.0) (2020-12-21)

**Note:** Version bump only for package @rocket.chat/fuselage-ui-kit

# [0.19.0](https://github.com/RocketChat/fuselage/compare/v0.18.0...v0.19.0) (2020-11-28)

**Note:** Version bump only for package @rocket.chat/fuselage-ui-kit

# [0.18.0](https://github.com/RocketChat/fuselage/compare/v0.17.3...v0.18.0) (2020-11-16)

### Bug Fixes

- Set a conservative output.environment on Webpack bundles ([#330](https://github.com/RocketChat/fuselage/issues/330)) ([62bf728](https://github.com/RocketChat/fuselage/commit/62bf728d3541d8d7ee72420347f2351359fb5df7))

## [0.17.3](https://github.com/RocketChat/fuselage/compare/v0.17.2...v0.17.3) (2020-11-16)

### Bug Fixes

- Set a conservative output.environment on Webpack bundles ([#330](https://github.com/RocketChat/fuselage/issues/330)) ([85d4a3a](https://github.com/RocketChat/fuselage/commit/85d4a3a5fd6881b07e97fb690d31baef405cfa69))

## [0.17.2](https://github.com/RocketChat/fuselage/compare/v0.17.1...v0.17.2) (2020-10-28)

**Note:** Version bump only for package @rocket.chat/fuselage-ui-kit

## [0.17.1](https://github.com/RocketChat/fuselage/compare/v0.17.0...v0.17.1) (2020-10-26)

**Note:** Version bump only for package @rocket.chat/fuselage-ui-kit

# [0.17.0](https://github.com/RocketChat/fuselage/compare/v0.16.0...v0.17.0) (2020-10-25)

**Note:** Version bump only for package @rocket.chat/fuselage-ui-kit

# [0.16.0](https://github.com/RocketChat/fuselage/compare/v0.15.1...v0.16.0) (2020-09-30)

**Note:** Version bump only for package @rocket.chat/fuselage-ui-kit

## [0.15.1](https://github.com/RocketChat/fuselage/compare/v0.15.0...v0.15.1) (2020-09-22)

**Note:** Version bump only for package @rocket.chat/fuselage-ui-kit

# [0.15.0](https://github.com/RocketChat/fuselage/compare/v0.14.1...v0.15.0) (2020-09-17)

**Note:** Version bump only for package @rocket.chat/fuselage-ui-kit

## [0.14.1](https://github.com/RocketChat/fuselage/compare/v0.14.0...v0.14.1) (2020-08-22)

**Note:** Version bump only for package @rocket.chat/fuselage-ui-kit

# [0.14.0](https://github.com/RocketChat/fuselage/compare/v0.13.2...v0.14.0) (2020-08-18)

**Note:** Version bump only for package @rocket.chat/fuselage-ui-kit

## [0.13.2](https://github.com/RocketChat/fuselage/compare/v0.13.1...v0.13.2) (2020-07-24)

**Note:** Version bump only for package @rocket.chat/fuselage-ui-kit

## [0.13.1](https://github.com/RocketChat/fuselage/compare/v0.13.0...v0.13.1) (2020-07-17)

### Bug Fixes

- Select mutations and ui-kit alerts ([#263](https://github.com/RocketChat/fuselage/issues/263)) ([661398d](https://github.com/RocketChat/fuselage/commit/661398dfdeaf827dadc46d24a7382d69f43f9742))

# [0.13.0](https://github.com/RocketChat/fuselage/compare/v0.12.0...v0.13.0) (2020-07-14)

**Note:** Version bump only for package @rocket.chat/fuselage-ui-kit

# [0.12.0](https://github.com/RocketChat/fuselage/compare/v0.11.0...v0.12.0) (2020-07-14)

**Note:** Version bump only for package @rocket.chat/fuselage-ui-kit

# [0.11.0](https://github.com/RocketChat/fuselage/compare/v0.10.0...v0.11.0) (2020-07-11)

**Note:** Version bump only for package @rocket.chat/fuselage-ui-kit

# [0.10.0](https://github.com/RocketChat/fuselage/compare/v0.9.0...v0.10.0) (2020-06-20)

### Bug Fixes

- Missing legacy icons ([#238](https://github.com/RocketChat/fuselage/issues/238)) ([1d74390](https://github.com/RocketChat/fuselage/commit/1d74390))

# [0.9.0](https://github.com/RocketChat/fuselage/compare/v0.8.0...v0.9.0) (2020-05-21)

### Bug Fixes

- Deprecation warnings ([#227](https://github.com/RocketChat/fuselage/issues/227)) ([46322a8](https://github.com/RocketChat/fuselage/commit/46322a8e2781b4293adc7fdf4fcffae20f0d170f))

### Features

- New Box props ([#213](https://github.com/RocketChat/fuselage/issues/213)) ([b593875](https://github.com/RocketChat/fuselage/commit/b593875f3561e334412f9d7e2fbe81007ed8098e))

# [0.8.0](https://github.com/RocketChat/fuselage/compare/v0.7.1...v0.8.0) (2020-04-22)

### Features

- Refactor static styles ([#201](https://github.com/RocketChat/fuselage/issues/201)) ([e1bdc65](https://github.com/RocketChat/fuselage/commit/e1bdc655a0dfe0f88261d3fab84c2e42c2ad581e))

## [0.7.1](https://github.com/RocketChat/fuselage/compare/v0.7.0...v0.7.1) (2020-04-01)

### Bug Fixes

- Fix ui kit babel config ([#191](https://github.com/RocketChat/fuselage/issues/191)) ([47295d8](https://github.com/RocketChat/fuselage/commit/47295d87740bc0ceb5e2bbb1901c2340cab860b6))

# [0.7.0](https://github.com/RocketChat/fuselage/compare/v0.6.2...v0.7.0) (2020-04-01)

### Bug Fixes

- Production build of [@rocket](https://github.com/rocket).chat/fuselage-ui-kit ([#190](https://github.com/RocketChat/fuselage/issues/190)) ([15a975a](https://github.com/RocketChat/fuselage/commit/15a975ab58688b29bfa93cd110bdc3d7e10de4ef))

### Features

- Custom prop types and more props to Box ([#181](https://github.com/RocketChat/fuselage/issues/181)) ([119e815](https://github.com/RocketChat/fuselage/commit/119e815ac9a0b85c1649c53bab62390b25aae4b3))

## [0.6.2](https://github.com/RocketChat/fuselage/compare/v0.6.1...v0.6.2) (2020-03-31)

**Note:** Version bump only for package @rocket.chat/fuselage-ui-kit

## [0.6.1](https://github.com/RocketChat/fuselage/compare/v0.6.0...v0.6.1) (2020-03-24)

### Bug Fixes

- Spacing and markup in Ui Kit inputs ([#176](https://github.com/RocketChat/fuselage/issues/176)) ([e6df266](https://github.com/RocketChat/fuselage/commit/e6df266c1297e75c9de21149e98d23c919f76f79))

# [0.6.0](https://github.com/RocketChat/fuselage/compare/v0.5.0...v0.6.0) (2020-03-20)

**Note:** Version bump only for package @rocket.chat/fuselage-ui-kit

# [0.5.0](https://github.com/RocketChat/fuselage/compare/v0.4.1...v0.5.0) (2020-03-20)

**Note:** Version bump only for package @rocket.chat/fuselage-ui-kit

## [0.4.1](https://github.com/RocketChat/fuselage/compare/v0.4.0...v0.4.1) (2020-03-16)

**Note:** Version bump only for package @rocket.chat/fuselage-ui-kit

# [0.4.0](https://github.com/RocketChat/fuselage/compare/v0.3.0...v0.4.0) (2020-03-10)

**Note:** Version bump only for package @rocket.chat/fuselage-ui-kit

# [0.3.0](https://github.com/RocketChat/fuselage/compare/v0.2.0...v0.3.0) (2020-02-17)

### Bug Fixes

- actionId on action hooks ([#149](https://github.com/RocketChat/fuselage/issues/149)) ([c305eb2](https://github.com/RocketChat/fuselage/commit/c305eb2171463589ed24460d05d648daf984d267))

# [0.2.0](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.30...v0.2.0) (2020-02-13)

**Note:** Version bump only for package @rocket.chat/fuselage-ui-kit

# [0.2.0-alpha.30](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.29...v0.2.0-alpha.30) (2020-02-12)

### Bug Fixes

- Safari not triggering buttons anchors ([#146](https://github.com/RocketChat/fuselage/issues/146)) ([2cb5aaa](https://github.com/RocketChat/fuselage/commit/2cb5aaaf4c71e277a0a8ea556a8b9efbb3e58620))

# [0.2.0-alpha.29](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.28...v0.2.0-alpha.29) (2020-02-10)

**Note:** Version bump only for package @rocket.chat/fuselage-ui-kit

# [0.2.0-alpha.28](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.27...v0.2.0-alpha.28) (2020-02-10)

**Note:** Version bump only for package @rocket.chat/fuselage-ui-kit

# [0.2.0-alpha.27](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.26...v0.2.0-alpha.27) (2020-02-10)

**Note:** Version bump only for package @rocket.chat/fuselage-ui-kit

# [0.2.0-alpha.26](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.25...v0.2.0-alpha.26) (2020-02-10)

### Bug Fixes

- Select autofocus ([#141](https://github.com/RocketChat/fuselage/issues/141)) ([25849ee](https://github.com/RocketChat/fuselage/commit/25849eed55e4edbf26f54ae4a72c71c1d528e850))

# [0.2.0-alpha.25](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.24...v0.2.0-alpha.25) (2020-02-10)

**Note:** Version bump only for package @rocket.chat/fuselage-ui-kit

# [0.2.0-alpha.24](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.23...v0.2.0-alpha.24) (2020-02-09)

**Note:** Version bump only for package @rocket.chat/fuselage-ui-kit

# [0.2.0-alpha.23](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.22...v0.2.0-alpha.23) (2020-02-07)

### Bug Fixes

- Section with Overflow visibility ([#138](https://github.com/RocketChat/fuselage/issues/138)) ([d0da3cd](https://github.com/RocketChat/fuselage/commit/d0da3cd7db31880c812519b7799f04555776167f))

# [0.2.0-alpha.22](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.21...v0.2.0-alpha.22) (2020-02-07)

### Bug Fixes

- Select/MultiSelect focus submitting form ([#134](https://github.com/RocketChat/fuselage/issues/134)) ([630e622](https://github.com/RocketChat/fuselage/commit/630e622d8535fcaa06a8a736c6e0d273b450b739))
- UIKit stopPropagation ([#137](https://github.com/RocketChat/fuselage/issues/137)) ([86939ea](https://github.com/RocketChat/fuselage/commit/86939eaae182d6554879468745780d83bc977b9e))
- uikit using react components ([#135](https://github.com/RocketChat/fuselage/issues/135)) ([52fcedb](https://github.com/RocketChat/fuselage/commit/52fcedb0efbc33ad4240c83fd92a325fcc9f0f4c))

# [0.2.0-alpha.21](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.20...v0.2.0-alpha.21) (2020-02-05)

**Note:** Version bump only for package @rocket.chat/fuselage-ui-kit

# [0.2.0-alpha.20](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.19...v0.2.0-alpha.20) (2020-02-01)

### Bug Fixes

- ui-kit margins warnings and unique ids ([#130](https://github.com/RocketChat/fuselage/issues/130)) ([cdaa358](https://github.com/RocketChat/fuselage/commit/cdaa3580516aa652d7a318c6d076065954a3e289))

### Features

- ui-kit initial value ([#131](https://github.com/RocketChat/fuselage/issues/131)) ([3c6cab4](https://github.com/RocketChat/fuselage/commit/3c6cab4bd7d6ba459841f6f847ef42229b097294))
- UiKit error states ([#133](https://github.com/RocketChat/fuselage/issues/133)) ([d6b3842](https://github.com/RocketChat/fuselage/commit/d6b38429597963e1e437189c64a7e2be5e8715c0))

# [0.2.0-alpha.19](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.18...v0.2.0-alpha.19) (2020-01-13)

### Features

- Position, Modal, Options components ([#116](https://github.com/RocketChat/fuselage/issues/116)) ([af1916a](https://github.com/RocketChat/fuselage/commit/af1916a22c677939adda04fe417dafe406292762)), closes [#117](https://github.com/RocketChat/fuselage/issues/117)

# [0.2.0-alpha.18](https://github.com/RocketChat/fuselage/compare/v0.2.0-alpha.17...v0.2.0-alpha.18) (2019-12-31)

### Features

- UI Kit ([#95](https://github.com/RocketChat/fuselage/issues/95)) ([6d4162b](https://github.com/RocketChat/fuselage/commit/6d4162bb8c121b1e89f8c818e7106bce49f09c27)), closes [#94](https://github.com/RocketChat/fuselage/issues/94) [#109](https://github.com/RocketChat/fuselage/issues/109) [#108](https://github.com/RocketChat/fuselage/issues/108) [#111](https://github.com/RocketChat/fuselage/issues/111)
