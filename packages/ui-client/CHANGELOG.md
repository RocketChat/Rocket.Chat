# @rocket.chat/ui-client

## 36.0.0-rc.0

### Major Changes

- ([#40697](https://github.com/RocketChat/Rocket.Chat/pull/40697) by [@aleksandernsilva](https://github.com/aleksandernsilva)) Adds support for registering multiple phone numbers with labels per user. **Breaking:** the `phone` user field is replaced by the `phones` array (`{ number, label? }[]`); existing numbers are migrated automatically on upgrade.

- ([#41828](https://github.com/RocketChat/Rocket.Chat/pull/41828)) Removes the "Allow Anonymous Write" setting (`Accounts_AllowAnonymousWrite`), the "Or talk as anonymous" composer action, and the anonymous branch of the `registerUser` method. Anonymous read remains available. The `anonymous` role is removed along with its default permissions and the `afterVerifyEmail` method. On upgrade the setting and role are deleted from the database and any existing users holding the `anonymous` role are deactivated and logged out.

### Minor Changes

- ([#42818](https://github.com/RocketChat/Rocket.Chat/pull/42818)) Renders autocompletes, UiKit selects, room members, banned users, team channels and call member lists with the `Item` rows, and names the icons of user and room options for assistive technology

- ([#42646](https://github.com/RocketChat/Rocket.Chat/pull/42646)) Shows a user's roles by scope, workspace and room. In a message header, each scope collapses into one tag named after the first role with a count of the rest (`Admin +2`); hovering a tag lists them all and clicking it opens the user card. The `@username` next to the author's name is no longer shown, bots get their tag even without any role, and users created for apps are tagged `App`. The user card shows the workspace roles in a band at the top and the room roles in its list, and the full profile lists them as separate fields.

- ([#42500](https://github.com/RocketChat/Rocket.Chat/pull/42500)) Moves the `UserCard` and `UserInfo` components, along with the date formatting helpers and hooks they rely on, from the web app into `@rocket.chat/ui-client`

- ([#42628](https://github.com/RocketChat/Rocket.Chat/pull/42628)) Adds a reusable hover card: `useHoverCard` and `HoverCardPopover` for the hover intent (open and close delays, hand-off between triggers, Escape, staying open while the card's own menu is open, no hover on devices that can't hover), and `HoverCard`, `HoverCardBand`, `HoverCardSection`, `HoverCardHeader`, `HoverCardInfoList`, `HoverCardInfoItem` and `HoverCardActions` for its layout. The user card is built on it.

- ([#42628](https://github.com/RocketChat/Rocket.Chat/pull/42628)) Redesigns the user card. It shows the user's username, roles and local time as a labelled list, a "Full profile" link and the actions; the bio is left to the full profile. The local time reads as the time and its offset (`10:41 PM (UTC +1)`), with a sign on positive and zero offsets.

- ([#42628](https://github.com/RocketChat/Rocket.Chat/pull/42628)) Redesigns the user information panel. The contextual bar is renamed "Full profile", shows a smaller avatar next to the name and status, lets each field be copied, and opens the avatar in the image gallery when clicked.

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

- ([#42506](https://github.com/RocketChat/Rocket.Chat/pull/42506)) Fixes the local time missing for users in UTC+0 or in time zones with a fractional offset (e.g. UTC+5:30) on the user card, the user info panel and the OAuth authorization card, where the user info panel also showed a stray "0" for UTC+0

- ([#43047](https://github.com/RocketChat/Rocket.Chat/pull/43047)) Spaces room tags, permission checkboxes, the selected room in room autocompletes, attachment titles and ABAC attributes with the spacing scale's gap instead of 2px margins, which shifts them by 2 to 4px

- ([#42510](https://github.com/RocketChat/Rocket.Chat/pull/42510)) Opens the user card by hovering a message author's name or avatar, or a user mention, and opens the full user info by clicking them or pressing Enter or Space on the author's name or a mention. A card opened by hover doesn't take focus from what the user is doing.

- <details><summary>Updated dependencies [80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 53bf8feb0c2075ee243d90c42ca2934098b93709, 7fbb5676fe0d2c034f4c52586ab858b3796e5dc6, 5c7b25f68d677d8bdbde3ed4c56ad0bba60ce71d, 5c7b25f68d677d8bdbde3ed4c56ad0bba60ce71d, 4c379a0d016fcf010bab86ddd94a22ff2401606e, 766ac93fba3c991c79c9bfcb404f6ec7fd1e30f8, 7fbb5676fe0d2c034f4c52586ab858b3796e5dc6, 4c379a0d016fcf010bab86ddd94a22ff2401606e, ad08045f56e3921e88ed021aa2945c9ba670e5f5, cea4d4428a0d86c6fc868542d4fb00a36ffaa27d, 7fbb5676fe0d2c034f4c52586ab858b3796e5dc6, 4c379a0d016fcf010bab86ddd94a22ff2401606e, 25fd477c2c38f71e9a16b7e2896d39efd43bfc61, 05e9b38a001919252360351f0bc3e46cc990a6ac, 25fd477c2c38f71e9a16b7e2896d39efd43bfc61, 2184b09b0bdacdb0bced60dc054a818a92c98131, e1b509fbca35eba10e21e4aa3bc15c56f44a2845, 0285f08c086dae6beb0f1365a85f522fb4818435, 6b86dffd3a05f65fff000bb697fbb40350664629, 5e6b6bd25ea82b9c884d49871870f71dc532a061, 05e9b38a001919252360351f0bc3e46cc990a6ac, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, e1b509fbca35eba10e21e4aa3bc15c56f44a2845, 2d3331be63dde3449245963c33444dcb15fa8869, a9b2bb76d88e4d2743e0817b15e6447e7c9c46eb, 933187fc0f51b3537a04df0cc1045015acad222f, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, 80dceecf12fd1216dc3fdb9a4f42e51afbf23a75, a838cc5af0652f59d0ab30aa1a488abded0622b1, daa677895dad92d6aab1e84a09f190efd2755ef9, 034260ee3eec49db0a2a86572bacf5e14490815d, 87667dcb84de0ce97f4ace88c900801254fa6535, 87667dcb84de0ce97f4ace88c900801254fa6535, 87667dcb84de0ce97f4ace88c900801254fa6535, 87667dcb84de0ce97f4ace88c900801254fa6535, 87667dcb84de0ce97f4ace88c900801254fa6535, 01204df7088b1362f14438d99c44bc4f6d6e840e, 982270a515cc061aafccb82a0605a36ce929d56c]:</summary>
  - @rocket.chat/fuselage@1.0.0-rc.0
  - @rocket.chat/ui-contexts@36.0.0-rc.0
  - @rocket.chat/fuselage-hooks@0.44.0-rc.0
  - @rocket.chat/onboarding-ui@1.0.0-rc.0
  - @rocket.chat/icons@0.52.0-rc.0
  - @rocket.chat/tools@0.5.0-rc.0
  - @rocket.chat/ui-avatar@32.0.0-rc.0
  - @rocket.chat/css-in-js@0.33.3-rc.0

  </details>

## 35.0.0

### Minor Changes

- ([#41020](https://github.com/RocketChat/Rocket.Chat/pull/41020)) Adds a **Realtime Message Composer**, available as an opt-in **Feature Preview** (My Account → Feature Preview → Message → **Realtime message composer**). While the feature preview is off, the message composer keeps its current plain-text behavior.

- ([#41088](https://github.com/RocketChat/Rocket.Chat/pull/41088)) Adds a configurable **Room Toolbox Layout**, available as an opt-in **Feature Preview** (My Account → Feature Preview → Room → **Room Toolbox Layout**). While the feature preview is off, the room header toolbox keeps its current behavior and the setting has no effect.

  Admins can define the layout through the new workspace setting **Room Toolbox Layout** (`Room_Toolbox_Layout`) under **Admin → Settings → Layout → Room Header**, which is itself only shown when **Feature Preview** is enabled for the workspace. The setting value is validated against a JSON schema when saved, so a malformed configuration is rejected with an error instead of being silently ignored

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

- ([#42023](https://github.com/RocketChat/Rocket.Chat/pull/42023)) Migrates the setup wizard off the `getSetupWizardParameters`, `cloud:getWorkspaceRegisterData` and `registerUser` real-time API methods, in favor of `GET /v1/setupWizard.parameters`, `GET /v1/cloud.workspaceRegisterData` and `POST /v1/users.register`. The first two methods are now deprecated and keep working until they are removed in 9.0.0.

- ([#41548](https://github.com/RocketChat/Rocket.Chat/pull/41548)) Improves performance of several hot code paths without changing behavior: generates random IDs with a single `crypto.randomBytes` call instead of one per character, caches constant regular expressions used by the markdown/mention/autotranslate parsers instead of recompiling them for every message, skips the channel-mention database query for messages without channel mentions, deduplicates the room member count query when a message contains both `@all` and `@here`, and replaces linear array scans and spread-accumulators with Map/Set lookups in API response shaping (files, DM members, directory search and team listing).

- ([#42280](https://github.com/RocketChat/Rocket.Chat/pull/42280)) Fixes the custom scrollbars staying permanently visible on virtualized lists (sidebar room list, message list, thread list, discussions list and other paginated virtual lists) instead of hiding when the pointer is away

- <details><summary>Updated dependencies [639dcb1a2d2116eeb956c7dfc7890b48cbdf9782]:</summary>
  - @rocket.chat/css-in-js@0.33.2
  - @rocket.chat/ui-avatar@31.0.0
  - @rocket.chat/ui-contexts@35.0.0

  </details>

## 35.0.0-rc.0

### Minor Changes

- ([#41020](https://github.com/RocketChat/Rocket.Chat/pull/41020)) Adds a **Realtime Message Composer**, available as an opt-in **Feature Preview** (My Account → Feature Preview → Message → **Realtime message composer**). While the feature preview is off, the message composer keeps its current plain-text behavior.

- ([#41088](https://github.com/RocketChat/Rocket.Chat/pull/41088)) Adds a configurable **Room Toolbox Layout**, available as an opt-in **Feature Preview** (My Account → Feature Preview → Room → **Room Toolbox Layout**). While the feature preview is off, the room header toolbox keeps its current behavior and the setting has no effect.

  Admins can define the layout through the new workspace setting **Room Toolbox Layout** (`Room_Toolbox_Layout`) under **Admin → Settings → Layout → Room Header**, which is itself only shown when **Feature Preview** is enabled for the workspace. The setting value is validated against a JSON schema when saved, so a malformed configuration is rejected with an error instead of being silently ignored

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

- ([#42023](https://github.com/RocketChat/Rocket.Chat/pull/42023)) Migrates the setup wizard off the `getSetupWizardParameters`, `cloud:getWorkspaceRegisterData` and `registerUser` real-time API methods, in favor of `GET /v1/setupWizard.parameters`, `GET /v1/cloud.workspaceRegisterData` and `POST /v1/users.register`. The first two methods are now deprecated and keep working until they are removed in 9.0.0.

- ([#41548](https://github.com/RocketChat/Rocket.Chat/pull/41548)) Improves performance of several hot code paths without changing behavior: generates random IDs with a single `crypto.randomBytes` call instead of one per character, caches constant regular expressions used by the markdown/mention/autotranslate parsers instead of recompiling them for every message, skips the channel-mention database query for messages without channel mentions, deduplicates the room member count query when a message contains both `@all` and `@here`, and replaces linear array scans and spread-accumulators with Map/Set lookups in API response shaping (files, DM members, directory search and team listing).

- ([#42280](https://github.com/RocketChat/Rocket.Chat/pull/42280)) Fixes the custom scrollbars staying permanently visible on virtualized lists (sidebar room list, message list, thread list, discussions list and other paginated virtual lists) instead of hiding when the pointer is away

- <details><summary>Updated dependencies [639dcb1a2d2116eeb956c7dfc7890b48cbdf9782]:</summary>
  - @rocket.chat/css-in-js@0.33.2-rc.0
  - @rocket.chat/ui-contexts@35.0.0-rc.0
  - @rocket.chat/ui-avatar@31.0.0-rc.0

  </details>

## 34.0.0

### Minor Changes

- ([#41355](https://github.com/RocketChat/Rocket.Chat/pull/41355)) Replaces the "Drafts in sidebar" feature preview with an always-on draft indicator. Thread-composer drafts are also persisted per thread and indicated in the thread list

### Patch Changes

- ([#41763](https://github.com/RocketChat/Rocket.Chat/pull/41763)) Drops `@rocket.chat/string-helpers` in favor of `@rocket.chat/tools`

- <details><summary>Updated dependencies [742009a09148e33d141f50691cdec0f7e9818535]:</summary>
  - @rocket.chat/tools@0.4.0
  - @rocket.chat/ui-avatar@30.0.0
  - @rocket.chat/ui-contexts@34.0.0

  </details>

## 34.0.0-rc.0

### Minor Changes

- ([#41355](https://github.com/RocketChat/Rocket.Chat/pull/41355)) Replaces the "Drafts in sidebar" feature preview with an always-on draft indicator. Thread-composer drafts are also persisted per thread and indicated in the thread list

### Patch Changes

- ([#41763](https://github.com/RocketChat/Rocket.Chat/pull/41763)) Drops `@rocket.chat/string-helpers` in favor of `@rocket.chat/tools`

- <details><summary>Updated dependencies [742009a09148e33d141f50691cdec0f7e9818535]:</summary>
  - @rocket.chat/tools@0.4.0-rc.0
  - @rocket.chat/ui-contexts@34.0.0-rc.0
  - @rocket.chat/ui-avatar@30.0.0-rc.0

  </details>

## 33.0.0

### Minor Changes

- ([#40890](https://github.com/RocketChat/Rocket.Chat/pull/40890)) Adds AI Search with semantic message results, optional OpenAI-compatible answers, and AI Center configuration.

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@29.0.0
  - @rocket.chat/ui-contexts@33.0.0

  </details>

## 33.0.0-rc.0

### Minor Changes

- ([#40890](https://github.com/RocketChat/Rocket.Chat/pull/40890)) Adds AI Search with semantic message results, optional OpenAI-compatible answers, and AI Center configuration.

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@33.0.0-rc.0
  - @rocket.chat/ui-avatar@29.0.0-rc.0

  </details>

## 32.0.0

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@28.0.0
  - @rocket.chat/ui-contexts@32.0.0

  </details>

## 32.0.0-rc.0

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@32.0.0-rc.0
  - @rocket.chat/ui-avatar@28.0.0-rc.0

  </details>

## 31.0.0

### Minor Changes

- ([#38225](https://github.com/RocketChat/Rocket.Chat/pull/38225)) Adds a new "Drafts" group to the sidebar, providing quick access to all rooms with unfinished messages.
  > This feature is available under the `Drafts in sidebar` feature preview and needs to be enabled in settings to be tested.

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@27.0.0
  - @rocket.chat/ui-contexts@31.0.0

  </details>

## 31.0.0-rc.0

### Minor Changes

- ([#38225](https://github.com/RocketChat/Rocket.Chat/pull/38225)) Adds a new "Drafts" group to the sidebar, providing quick access to all rooms with unfinished messages.
  > This feature is available under the `Drafts in sidebar` feature preview and needs to be enabled in settings to be tested.

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@31.0.0-rc.0
  - @rocket.chat/ui-avatar@27.0.0-rc.0

  </details>

## 30.0.0

### Minor Changes

- ([#40181](https://github.com/RocketChat/Rocket.Chat/pull/40181)) Adds file thumbnails with image preview to the message composer attachments

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@26.0.0
  - @rocket.chat/ui-contexts@30.0.0

  </details>

## 30.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@26.0.0-rc.2
  - @rocket.chat/ui-contexts@30.0.0-rc.2

  </details>

## 30.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@30.0.0-rc.1
  - @rocket.chat/ui-avatar@26.0.0-rc.1

  </details>

## 29.0.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@25.0.2
  - @rocket.chat/ui-contexts@29.0.2

  </details>

## 29.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@25.0.1
  - @rocket.chat/ui-contexts@29.0.1

  </details>

## 30.0.0-rc.0

### Minor Changes

- ([#40181](https://github.com/RocketChat/Rocket.Chat/pull/40181)) Adds file thumbnails with image preview to the message composer attachments

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@26.0.0-rc.0
  - @rocket.chat/ui-contexts@30.0.0-rc.0

  </details>

## 29.0.0

### Patch Changes

- ([#38989](https://github.com/RocketChat/Rocket.Chat/pull/38989)) chore(eslint): Upgrades ESLint and its configuration

- <details><summary>Updated dependencies [539659af22bc19880eda047dfc0b152472ccb65c, 43d0cfc6a70e8a31d5f3d24162216dae6b07efdd]:</summary>
  - @rocket.chat/ui-contexts@29.0.0
  - @rocket.chat/ui-avatar@25.0.0

  </details>

## 29.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@25.0.0-rc.4
  - @rocket.chat/ui-contexts@29.0.0-rc.4

  </details>

## 29.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@25.0.0-rc.3
  - @rocket.chat/ui-contexts@29.0.0-rc.3

  </details>

## 29.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@25.0.0-rc.2
  - @rocket.chat/ui-contexts@29.0.0-rc.2

  </details>

## 29.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@25.0.0-rc.1
  - @rocket.chat/ui-contexts@29.0.0-rc.1

  </details>

## 29.0.0-rc.0

### Patch Changes

- ([#38989](https://github.com/RocketChat/Rocket.Chat/pull/38989)) chore(eslint): Upgrades ESLint and its configuration

- <details><summary>Updated dependencies [539659af22bc19880eda047dfc0b152472ccb65c, 43d0cfc6a70e8a31d5f3d24162216dae6b07efdd]:</summary>
  - @rocket.chat/ui-contexts@29.0.0-rc.0
  - @rocket.chat/ui-avatar@25.0.0-rc.0

  </details>

## 28.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@24.0.1
  - @rocket.chat/ui-contexts@28.0.1

  </details>

## 28.0.0

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@24.0.0
  - @rocket.chat/ui-contexts@28.0.0

  </details>

## 28.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@24.0.0-rc.2
  - @rocket.chat/ui-contexts@28.0.0-rc.2

  </details>

## 28.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@24.0.0-rc.1
  - @rocket.chat/ui-contexts@28.0.0-rc.1

  </details>

## 28.0.0-rc.0

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@24.0.0-rc.0
  - @rocket.chat/ui-contexts@28.0.0-rc.0

  </details>

## 27.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@23.0.1
  - @rocket.chat/ui-contexts@27.0.1

  </details>

## 27.0.0

### Minor Changes

- ([#38032](https://github.com/RocketChat/Rocket.Chat/pull/38032)) Enables the password policy by default to ensure security by default and alters SetupWizard to handle errors

### Patch Changes

- ([#38169](https://github.com/RocketChat/Rocket.Chat/pull/38169)) Introduces in the call widget a quick link that redirects to the participant's direct message

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@27.0.0
  - @rocket.chat/ui-avatar@23.0.0

  </details>

## 27.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@23.0.0-rc.2
  - @rocket.chat/ui-contexts@27.0.0-rc.2

  </details>

## 27.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@27.0.0-rc.1
  - @rocket.chat/ui-avatar@23.0.0-rc.1
  </details>

## 27.0.0-rc.0

### Minor Changes

- ([#38032](https://github.com/RocketChat/Rocket.Chat/pull/38032)) Enables the password policy by default to ensure security by default and alters SetupWizard to handle errors

### Patch Changes

- ([#38169](https://github.com/RocketChat/Rocket.Chat/pull/38169)) Introduces in the call widget a quick link that redirects to the participant's direct message

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@27.0.0-rc.0
  - @rocket.chat/ui-avatar@23.0.0-rc.0

## 26.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@22.0.1
  - @rocket.chat/ui-contexts@26.0.1

  </details>

## 26.0.0

### Major Changes

- ([#36976](https://github.com/RocketChat/Rocket.Chat/pull/36976)) Promotes Timestamp Parser from preview state to stable

- ([#37022](https://github.com/RocketChat/Rocket.Chat/pull/37022)) Promotes Resizable Contextualbars from preview state to stable.

- ([#36966](https://github.com/RocketChat/Rocket.Chat/pull/36966)) Promotes quick reactions from preview state to stable

- ([#37285](https://github.com/RocketChat/Rocket.Chat/pull/37285)) Promotes Enhanced Navigation from preview state to stable.

### Patch Changes

- <details><summary>Updated dependencies [ac11ea05ffadeca978c794ff38d5199d9acb2c29]:</summary>
  - @rocket.chat/ui-contexts@26.0.0
  - @rocket.chat/ui-avatar@22.0.0

  </details>

## 26.0.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@22.0.0-rc.5
  - @rocket.chat/ui-contexts@26.0.0-rc.5

  </details>

## 26.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@22.0.0-rc.4
  - @rocket.chat/ui-contexts@26.0.0-rc.4

  </details>

## 26.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@26.0.0-rc.3
  - @rocket.chat/ui-avatar@22.0.0-rc.3

  </details>

## 26.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@22.0.0-rc.2
  - @rocket.chat/ui-contexts@26.0.0-rc.2

  </details>

## 26.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@22.0.0-rc.1
  - @rocket.chat/ui-contexts@26.0.0-rc.1

  </details>

## 26.0.0-rc.0

### Major Changes

- ([#36976](https://github.com/RocketChat/Rocket.Chat/pull/36976)) Promotes Timestamp Parser from preview state to stable

- ([#37022](https://github.com/RocketChat/Rocket.Chat/pull/37022)) Promotes Resizable Contextualbars from preview state to stable.

- ([#36966](https://github.com/RocketChat/Rocket.Chat/pull/36966)) Promotes quick reactions from preview state to stable

- ([#37285](https://github.com/RocketChat/Rocket.Chat/pull/37285)) Promotes Enhanced Navigation from preview state to stable.

### Patch Changes

- <details><summary>Updated dependencies [ac11ea05ffadeca978c794ff38d5199d9acb2c29]:</summary>
  - @rocket.chat/ui-contexts@26.0.0-rc.0
  - @rocket.chat/ui-avatar@22.0.0-rc.0

  </details>

## 25.0.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@21.0.2
  - @rocket.chat/ui-contexts@25.0.2

  </details>

## 25.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@21.0.1
  - @rocket.chat/ui-contexts@25.0.1

  </details>

## 25.0.0

### Minor Changes

- ([#37327](https://github.com/RocketChat/Rocket.Chat/pull/37327)) Adds complexity requirements to end-to-end encryption passphrase

- ([#37524](https://github.com/RocketChat/Rocket.Chat/pull/37524)) Moves the expandable message composer out of feature preview

### Patch Changes

- <details><summary>Updated dependencies [31ab78f0d4648b2ba99513ffce737d52ee34fe7f, 99255057f27b9d854a89da815681a03d0776f846]:</summary>
  - @rocket.chat/ui-contexts@25.0.0
  - @rocket.chat/ui-avatar@21.0.0

  </details>

## 25.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@21.0.0-rc.2
  - @rocket.chat/ui-contexts@25.0.0-rc.2

  </details>

## 25.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@21.0.0-rc.1
  - @rocket.chat/ui-contexts@25.0.0-rc.1

  </details>

## 25.0.0-rc.0

### Minor Changes

- ([#37327](https://github.com/RocketChat/Rocket.Chat/pull/37327)) Adds complexity requirements to end-to-end encryption passphrase

- ([#37524](https://github.com/RocketChat/Rocket.Chat/pull/37524)) Moves the expandable message composer out of feature preview

### Patch Changes

- <details><summary>Updated dependencies [31ab78f0d4648b2ba99513ffce737d52ee34fe7f, 99255057f27b9d854a89da815681a03d0776f846]:</summary>
  - @rocket.chat/ui-contexts@25.0.0-rc.0
  - @rocket.chat/ui-avatar@21.0.0-rc.0

  </details>

## 24.0.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@20.0.2
  - @rocket.chat/ui-contexts@24.0.2

  </details>

## 24.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@20.0.1
  - @rocket.chat/ui-contexts@24.0.1

  </details>

## 24.0.0

### Patch Changes

- ([#37154](https://github.com/RocketChat/Rocket.Chat/pull/37154)) Fixes a GUI crash happening in the admin user page when attempting to display an invalid custom field

- <details><summary>Updated dependencies [a25e88c06cafdbe3baf7a40e3bffe3aed5a81cf6]:</summary>
  - @rocket.chat/ui-contexts@24.0.0
  - @rocket.chat/ui-avatar@20.0.0

  </details>

## 24.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@20.0.0-rc.4
  - @rocket.chat/ui-contexts@24.0.0-rc.4

  </details>

## 24.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@20.0.0-rc.3
  - @rocket.chat/ui-contexts@24.0.0-rc.3

  </details>

## 24.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@20.0.0-rc.2
  - @rocket.chat/ui-contexts@24.0.0-rc.2

  </details>

## 24.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@20.0.0-rc.1
  - @rocket.chat/ui-contexts@24.0.0-rc.1

  </details>

## 24.0.0-rc.0

### Patch Changes

- ([#37154](https://github.com/RocketChat/Rocket.Chat/pull/37154)) Fixes a GUI crash happening in the admin user page when attempting to display an invalid custom field

- <details><summary>Updated dependencies [a25e88c06cafdbe3baf7a40e3bffe3aed5a81cf6]:</summary>
  - @rocket.chat/ui-contexts@24.0.0-rc.0
  - @rocket.chat/ui-avatar@20.0.0-rc.0

  </details>

## 23.0.0

### Minor Changes

- ([#36397](https://github.com/RocketChat/Rocket.Chat/pull/36397)) Introduces a new flow for requesting device permissions for Voice Calling, prompting the user before the request. Also solves a few issues with the device selection menu.

- ([#36974](https://github.com/RocketChat/Rocket.Chat/pull/36974)) Improves the Outbound Message modal’s scrolling on smaller viewports and with large templates

### Patch Changes

- ([#36207](https://github.com/RocketChat/Rocket.Chat/pull/36207)) Introduces the Outbound Message feature to Omnichannel, allowing organizations to initiate proactive communication with contacts through their preferred messaging channel directly from Rocket.Chat

- <details><summary>Updated dependencies [feba290fc403de27efb6bb9a571bec43413e976a, b0a4602a4461200b9872b2b073ec56fa55ecb466, c6ef437d9071dbd8c08152984dc39542b1ae7306]:</summary>
  - @rocket.chat/ui-contexts@23.0.0
  - @rocket.chat/ui-avatar@19.0.0

  </details>

## 23.0.0-rc.7

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@19.0.0-rc.7
  - @rocket.chat/ui-contexts@23.0.0-rc.7

  </details>

## 23.0.0-rc.6

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@19.0.0-rc.6
  - @rocket.chat/ui-contexts@23.0.0-rc.6

  </details>

## 23.0.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@19.0.0-rc.5
  - @rocket.chat/ui-contexts@23.0.0-rc.5

  </details>

## 23.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@19.0.0-rc.4
  - @rocket.chat/ui-contexts@23.0.0-rc.4

  </details>

## 23.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@19.0.0-rc.3
  - @rocket.chat/ui-contexts@23.0.0-rc.3

  </details>

## 23.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@19.0.0-rc.2
  - @rocket.chat/ui-contexts@23.0.0-rc.2
  </details>

## 23.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@19.0.0-rc.1
  - @rocket.chat/ui-contexts@23.0.0-rc.1

  </details>

## 23.0.0-rc.0

### Minor Changes

- ([#36397](https://github.com/RocketChat/Rocket.Chat/pull/36397)) Introduces a new flow for requesting device permissions for Voice Calling, prompting the user before the request. Also solves a few issues with the device selection menu.

- ([#36974](https://github.com/RocketChat/Rocket.Chat/pull/36974)) Improves the Outbound Message modal’s scrolling on smaller viewports and with large templates

### Patch Changes

- ([#36207](https://github.com/RocketChat/Rocket.Chat/pull/36207)) Introduces the Outbound Message feature to Omnichannel, allowing organizations to initiate proactive communication with contacts through their preferred messaging channel directly from Rocket.Chat

- <details><summary>Updated dependencies [feba290fc403de27efb6bb9a571bec43413e976a, b0a4602a4461200b9872b2b073ec56fa55ecb466, c6ef437d9071dbd8c08152984dc39542b1ae7306]:</summary>
  - @rocket.chat/ui-contexts@23.0.0-rc.0
  - @rocket.chat/ui-avatar@19.0.0-rc.0

  </details>

## 22.0.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@18.0.2
  - @rocket.chat/ui-contexts@22.0.2

  </details>

## 22.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@18.0.1
  - @rocket.chat/ui-contexts@22.0.1
  </details>

## 22.0.0

### Minor Changes

- ([#36315](https://github.com/RocketChat/Rocket.Chat/pull/36315)) Adds Wizard component to ui-client package

- ([#36049](https://github.com/RocketChat/Rocket.Chat/pull/36049)) Introduces the side navigation with a new filtering system. The update adds new filters for All, Mentions, Favorites, and Discussions, as well as dedicated filters for Omnichannel conversations and grouping by Teams, Channels, and DMs.
  > This change is being tested under `Enhanced navigation experience` feature preview, in order to check it you need to enabled it

### Patch Changes

- ([#36575](https://github.com/RocketChat/Rocket.Chat/pull/36575)) Adds an annotation prop to the WizardActions component, enabling the display of a contextual description alongside the action buttons.

- <details><summary>Updated dependencies [c7db598e9f3c2ad47f6a6be2a9ba7078533c245b]:</summary>
  - @rocket.chat/ui-contexts@22.0.0
  - @rocket.chat/ui-avatar@18.0.0

  </details>

## 22.0.0-rc.6

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@18.0.0-rc.6
  - @rocket.chat/ui-contexts@22.0.0-rc.6

  </details>

## 22.0.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@18.0.0-rc.5
  - @rocket.chat/ui-contexts@22.0.0-rc.5
  </details>

## 22.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@18.0.0-rc.4
  - @rocket.chat/ui-contexts@22.0.0-rc.4
  </details>

## 22.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@18.0.0-rc.3
  - @rocket.chat/ui-contexts@22.0.0-rc.3

  </details>

## 22.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@18.0.0-rc.2
  - @rocket.chat/ui-contexts@22.0.0-rc.2

  </details>

## 22.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@18.0.0-rc.1
  - @rocket.chat/ui-contexts@22.0.0-rc.1

  </details>

## 22.0.0-rc.0

### Minor Changes

- ([#36315](https://github.com/RocketChat/Rocket.Chat/pull/36315)) Adds Wizard component to ui-client package

- ([#36049](https://github.com/RocketChat/Rocket.Chat/pull/36049)) Introduces the side navigation with a new filtering system. The update adds new filters for All, Mentions, Favorites, and Discussions, as well as dedicated filters for Omnichannel conversations and grouping by Teams, Channels, and DMs.
  > This change is being tested under `Enhanced navigation experience` feature preview, in order to check it you need to enabled it

### Patch Changes

- ([#36575](https://github.com/RocketChat/Rocket.Chat/pull/36575)) Adds an annotation prop to the WizardActions component, enabling the display of a contextual description alongside the action buttons.

- <details><summary>Updated dependencies [c7db598e9f3c2ad47f6a6be2a9ba7078533c245b]:</summary>
  - @rocket.chat/ui-contexts@22.0.0-rc.0
  - @rocket.chat/ui-avatar@18.0.0-rc.0

  </details>

## 21.0.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@17.0.3
  - @rocket.chat/ui-contexts@21.0.3

  </details>

## 21.0.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@17.0.2
  - @rocket.chat/ui-contexts@21.0.2

  </details>

## 21.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@17.0.1
  - @rocket.chat/ui-contexts@21.0.1

  </details>

## 21.0.0

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@21.0.0
  - @rocket.chat/ui-avatar@17.0.0

  </details>

## 21.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@17.0.0-rc.2
  - @rocket.chat/ui-contexts@21.0.0-rc.2
  </details>

## 21.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-avatar@17.0.0-rc.1
  - @rocket.chat/ui-contexts@21.0.0-rc.1

  </details>

## 21.0.0-rc.0

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@21.0.0-rc.0
  - @rocket.chat/ui-avatar@17.0.0-rc.0

  </details>

## 20.0.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@20.0.3
  - @rocket.chat/ui-avatar@16.0.3
  </details>

## 20.0.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@20.0.2
  - @rocket.chat/ui-avatar@16.0.2

  </details>

## 20.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@20.0.1
  - @rocket.chat/ui-avatar@16.0.1

  </details>

## 20.0.0

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@20.0.0
  - @rocket.chat/ui-avatar@16.0.0

  </details>

## 20.0.0-rc.9

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@20.0.0-rc.9
  - @rocket.chat/ui-avatar@16.0.0-rc.9

  </details>

## 20.0.0-rc.8

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@20.0.0-rc.8
  - @rocket.chat/ui-avatar@16.0.0-rc.8

  </details>

## 20.0.0-rc.7

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@20.0.0-rc.7
  - @rocket.chat/ui-avatar@16.0.0-rc.7

  </details>

## 20.0.0-rc.6

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@20.0.0-rc.6
  - @rocket.chat/ui-avatar@16.0.0-rc.6

  </details>

## 20.0.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@20.0.0-rc.5
  - @rocket.chat/ui-avatar@16.0.0-rc.5

  </details>

## 20.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@20.0.0-rc.4
  - @rocket.chat/ui-avatar@16.0.0-rc.4

  </details>

## 20.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@20.0.0-rc.3
  - @rocket.chat/ui-avatar@16.0.0-rc.3

  </details>

## 20.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@20.0.0-rc.2
  - @rocket.chat/ui-avatar@16.0.0-rc.2

  </details>

## 20.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@20.0.0-rc.1
  - @rocket.chat/ui-avatar@16.0.0-rc.1
  </details>

## 20.0.0-rc.0

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@20.0.0-rc.0
  - @rocket.chat/ui-avatar@16.0.0-rc.0
  </details>

## 19.0.4

### Patch Changes

- @rocket.chat/ui-contexts@19.0.4
- @rocket.chat/ui-avatar@15.0.4

</details>

## 19.0.3

- <details><summary>Updated dependencies []:</summary>

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@19.0.3
  - @rocket.chat/ui-avatar@15.0.3
  </details>

## 19.0.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@19.0.2
  - @rocket.chat/ui-avatar@15.0.2

  </details>

## 19.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@19.0.1
  - @rocket.chat/ui-avatar@15.0.1

  </details>

## 19.0.0

### Minor Changes

- ([#35830](https://github.com/RocketChat/Rocket.Chat/pull/35830)) Introduces a new feature which enables dragging the VoIP call widget to change its position on the screen.

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@19.0.0
  - @rocket.chat/ui-avatar@15.0.0

  </details>

## 19.0.0-rc.6

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@19.0.0-rc.6
  - @rocket.chat/ui-avatar@15.0.0-rc.6

  </details>

## 19.0.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@19.0.0-rc.5
  - @rocket.chat/ui-avatar@15.0.0-rc.5

  </details>

## 19.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@19.0.0-rc.4
  - @rocket.chat/ui-avatar@15.0.0-rc.4

  </details>

## 19.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@19.0.0-rc.3
  - @rocket.chat/ui-avatar@15.0.0-rc.3

  </details>

## 19.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@19.0.0-rc.2
  - @rocket.chat/ui-avatar@15.0.0-rc.2
  </details>

## 19.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@19.0.0-rc.1
  - @rocket.chat/ui-avatar@15.0.0-rc.1

  </details>

## 19.0.0-rc.0

### Minor Changes

- ([#35830](https://github.com/RocketChat/Rocket.Chat/pull/35830)) Introduces a new feature which enables dragging the VoIP call widget to change its position on the screen.

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@19.0.0-rc.0
  - @rocket.chat/ui-avatar@15.0.0-rc.0

## 18.0.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@18.0.2
  - @rocket.chat/ui-avatar@14.0.2

  </details>

## 18.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@18.0.1
  - @rocket.chat/ui-avatar@14.0.1
    </details>

## 18.0.0

### Minor Changes

- ([#35613](https://github.com/RocketChat/Rocket.Chat/pull/35613)) Replaces the parent room tag in room header in favor of a button to back to the parent room
  > This change is being tested under `Enhanced navigation experience` feature preview, in order to check it you need to enabled it
- ([#35615](https://github.com/RocketChat/Rocket.Chat/pull/35615)) Removes the avatar in the room header
  > This change is being tested under `Enhanced navigation experience` feature preview, in order to check it you need to enabled it
- ([#35218](https://github.com/RocketChat/Rocket.Chat/pull/35218)) Adds a new admin page to audit settings changes in a server

- ([#35631](https://github.com/RocketChat/Rocket.Chat/pull/35631)) Places the room topic next to the room title
  > This change is being tested under `Enhanced navigation experience` feature preview, in order to check it you need to enabled it
- ([#35672](https://github.com/RocketChat/Rocket.Chat/pull/35672)) Restores the previous room announcement style
  > This change is being tested under `Enhanced navigation experience` feature preview, in order to check it you need to enabled it
- ([#35807](https://github.com/RocketChat/Rocket.Chat/pull/35807)) Moves the room search functionality from the sidebar to the navbar and reorganize their relative actions
  > This change is being tested under `Enhanced navigation experience` feature preview, in order to check it you need to enabled it

### Patch Changes

- <details><summary>Updated dependencies [1eeb139158fcd621a2b8d3a7de5bb512e659261d, d8eb824d242cbbeafb11b1c4a806860e4541ba79, 4690c55d8e379d0bd5dfa444f3e0a4175e88d8de]:</summary>
  - @rocket.chat/ui-contexts@18.0.0
  - @rocket.chat/ui-avatar@14.0.0

  </details>

## 18.0.0-rc.8

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@18.0.0-rc.8
  - @rocket.chat/ui-avatar@14.0.0-rc.8

  </details>

## 18.0.0-rc.7

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@18.0.0-rc.7
  - @rocket.chat/ui-avatar@14.0.0-rc.7

  </details>

## 18.0.0-rc.6

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@18.0.0-rc.6
  - @rocket.chat/ui-avatar@14.0.0-rc.6

  </details>

## 18.0.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@18.0.0-rc.5
  - @rocket.chat/ui-avatar@14.0.0-rc.5

  </details>

## 18.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@18.0.0-rc.4
  - @rocket.chat/ui-avatar@14.0.0-rc.4

  </details>

## 18.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@18.0.0-rc.3
  - @rocket.chat/ui-avatar@14.0.0-rc.3

  </details>

## 18.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@18.0.0-rc.2
  - @rocket.chat/ui-avatar@14.0.0-rc.2

  </details>

## 18.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@18.0.0-rc.1
  - @rocket.chat/ui-avatar@14.0.0-rc.1

  </details>

## 18.0.0-rc.0

### Minor Changes

- ([#35613](https://github.com/RocketChat/Rocket.Chat/pull/35613)) Replaces the parent room tag in room header in favor of a button to back to the parent room
  > This change is being tested under `Enhanced navigation experience` feature preview, in order to check it you need to enabled it
- ([#35615](https://github.com/RocketChat/Rocket.Chat/pull/35615)) Removes the avatar in the room header
  > This change is being tested under `Enhanced navigation experience` feature preview, in order to check it you need to enabled it
- ([#35218](https://github.com/RocketChat/Rocket.Chat/pull/35218)) Adds a new admin page to audit settings changes in a server

- ([#35631](https://github.com/RocketChat/Rocket.Chat/pull/35631)) Places the room topic next to the room title
  > This change is being tested under `Enhanced navigation experience` feature preview, in order to check it you need to enabled it
- ([#35672](https://github.com/RocketChat/Rocket.Chat/pull/35672)) Restores the previous room announcement style
  > This change is being tested under `Enhanced navigation experience` feature preview, in order to check it you need to enabled it
- ([#35807](https://github.com/RocketChat/Rocket.Chat/pull/35807)) Moves the room search functionality from the sidebar to the navbar and reorganize their relative actions
  > This change is being tested under `Enhanced navigation experience` feature preview, in order to check it you need to enabled it

### Patch Changes

- <details><summary>Updated dependencies [1eeb139158fcd621a2b8d3a7de5bb512e659261d, d8eb824d242cbbeafb11b1c4a806860e4541ba79, 4690c55d8e379d0bd5dfa444f3e0a4175e88d8de]:</summary>
  - @rocket.chat/ui-contexts@18.0.0-rc.0
  - @rocket.chat/ui-avatar@14.0.0-rc.0

  </details>

## 17.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@17.0.1
  - @rocket.chat/ui-avatar@13.0.1

  </details>

## 17.0.0

### Patch Changes

- ([#35286](https://github.com/RocketChat/Rocket.Chat/pull/35286)) Bumps fuselage and related packages versions to use the most recent releases of each package, especially the fix for the missing track of the fuselage slider component

- <details><summary>Updated dependencies [c7b21f1c1e479533a208771f3e15f064f2c7e3ff]:</summary>
  - @rocket.chat/ui-avatar@13.0.0
  - @rocket.chat/ui-contexts@17.0.0

  </details>

## 17.0.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@17.0.0-rc.5
  - @rocket.chat/ui-avatar@13.0.0-rc.5

  </details>

## 17.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@17.0.0-rc.4
  - @rocket.chat/ui-avatar@13.0.0-rc.4

  </details>

## 17.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@17.0.0-rc.3
  - @rocket.chat/ui-avatar@13.0.0-rc.3

  </details>

## 17.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@17.0.0-rc.2
  - @rocket.chat/ui-avatar@13.0.0-rc.2

  </details>

## 17.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@17.0.0-rc.1
  - @rocket.chat/ui-avatar@13.0.0-rc.1

  </details>

## 17.0.0-rc.0

### Patch Changes

- ([#35286](https://github.com/RocketChat/Rocket.Chat/pull/35286)) Bumps fuselage and related packages versions to use the most recent releases of each package, especially the fix for the missing track of the fuselage slider component

- <details><summary>Updated dependencies [c7b21f1c1e479533a208771f3e15f064f2c7e3ff]:</summary>
  - @rocket.chat/ui-avatar@13.0.0-rc.0
  - @rocket.chat/ui-contexts@17.0.0-rc.0

  </details>

## 16.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@16.0.1
  - @rocket.chat/ui-avatar@12.0.1

  </details>

## 16.0.0

### Patch Changes

- ([#35120](https://github.com/RocketChat/Rocket.Chat/pull/35120)) Fixes behavior of app updates that would save undesired field changes to documents

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@16.0.0
  - @rocket.chat/ui-avatar@12.0.0

  </details>

## 16.0.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@16.0.0-rc.5
  - @rocket.chat/ui-avatar@12.0.0-rc.5

  </details>

## 16.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@16.0.0-rc.4
  - @rocket.chat/ui-avatar@12.0.0-rc.4

  </details>

## 16.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@16.0.0-rc.3
  - @rocket.chat/ui-avatar@12.0.0-rc.3
  </details>

## 16.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@16.0.0-rc.2
  - @rocket.chat/ui-avatar@12.0.0-rc.2

  </details>

## 16.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@16.0.0-rc.1
  - @rocket.chat/ui-avatar@12.0.0-rc.1

  </details>

## 16.0.0-rc.0

### Patch Changes

- ([#35120](https://github.com/RocketChat/Rocket.Chat/pull/35120)) Fixes behavior of app updates that would save undesired field changes to documents

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@16.0.0-rc.0
  - @rocket.chat/ui-avatar@12.0.0-rc.0

  </details>

## 15.0.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@15.0.3
  - @rocket.chat/ui-avatar@11.0.3

  </details>

## 15.0.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@15.0.2
  - @rocket.chat/ui-avatar@11.0.2

  </details>

## 15.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@15.0.1
  - @rocket.chat/ui-avatar@11.0.1

  </details>

## 15.0.0

### Patch Changes

- ([#34858](https://github.com/RocketChat/Rocket.Chat/pull/34858)) Fixes an issue that prevented the apps-engine from reestablishing communications with subprocesses in some cases

- <details><summary>Updated dependencies [5506c406f4a22145ece065ad2b797225e94423ca]:</summary>
  - @rocket.chat/ui-contexts@15.0.0
  - @rocket.chat/ui-avatar@11.0.0

  </details>

## 15.0.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@15.0.0-rc.5
  - @rocket.chat/ui-avatar@11.0.0-rc.5

  </details>

## 15.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@15.0.0-rc.4
  - @rocket.chat/ui-avatar@11.0.0-rc.4

  </details>

## 15.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@15.0.0-rc.3
  - @rocket.chat/ui-avatar@11.0.0-rc.3

  </details>

## 15.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@15.0.0-rc.2
  - @rocket.chat/ui-avatar@11.0.0-rc.2

  </details>

## 15.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@15.0.0-rc.1
  - @rocket.chat/ui-avatar@11.0.0-rc.1

  </details>

## 15.0.0-rc.0

### Patch Changes

- ([#34858](https://github.com/RocketChat/Rocket.Chat/pull/34858)) Fixes an issue that prevented the apps-engine from reestablishing communications with subprocesses in some cases

- <details><summary>Updated dependencies [5506c406f4a22145ece065ad2b797225e94423ca]:</summary>
  - @rocket.chat/ui-contexts@15.0.0-rc.0
  - @rocket.chat/ui-avatar@11.0.0-rc.0

  </details>

## 14.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@14.0.1
  - @rocket.chat/ui-avatar@10.0.1

  </details>

## 14.0.0

### Patch Changes

- ([#34205](https://github.com/RocketChat/Rocket.Chat/pull/34205)) Fixes an error where the engine would not retry a subprocess restart if the last attempt failed

- ([#34858](https://github.com/RocketChat/Rocket.Chat/pull/34858)) Fixes an issue that prevented the apps-engine from reestablishing communications with subprocesses in some cases

- ([#34205](https://github.com/RocketChat/Rocket.Chat/pull/34205)) Fixes error propagation when trying to get the status of apps in some cases

- ([#34205](https://github.com/RocketChat/Rocket.Chat/pull/34205)) Fixes wrong data being reported to total failed apps metrics and statistics

- ([#34209](https://github.com/RocketChat/Rocket.Chat/pull/34209)) Fixed the data structure of the features preview

- <details><summary>Updated dependencies [76f6239ff1a9f34f163c03c140c4ceba62563b4e, c43220dcd8c1df86a6143d6553964ad2173903b3, 76f6239ff1a9f34f163c03c140c4ceba62563b4e, 76f6239ff1a9f34f163c03c140c4ceba62563b4e]:</summary>
  - @rocket.chat/ui-contexts@14.0.0
  - @rocket.chat/ui-avatar@10.0.0

  </details>

## 14.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@14.0.0-rc.3
  - @rocket.chat/ui-avatar@10.0.0-rc.3

  </details>

## 14.0.0-rc.2

### Patch Changes

- ([#34858](https://github.com/RocketChat/Rocket.Chat/pull/34858)) Fixes an issue that prevented the apps-engine from reestablishing communications with subprocesses in some cases

- <details><summary>Updated dependencies [c43220dcd8c1df86a6143d6553964ad2173903b3]:</summary>
  - @rocket.chat/ui-contexts@14.0.0-rc.2
  - @rocket.chat/ui-avatar@10.0.0-rc.2

  </details>

## 14.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@14.0.0-rc.1
  - @rocket.chat/ui-avatar@10.0.0-rc.1

  </details>

## 14.0.0-rc.0

### Patch Changes

- ([#34205](https://github.com/RocketChat/Rocket.Chat/pull/34205)) Fixes an error where the engine would not retry a subprocess restart if the last attempt failed

- ([#34205](https://github.com/RocketChat/Rocket.Chat/pull/34205)) Fixes error propagation when trying to get the status of apps in some cases

- ([#34205](https://github.com/RocketChat/Rocket.Chat/pull/34205)) Fixes wrong data being reported to total failed apps metrics and statistics

- ([#34209](https://github.com/RocketChat/Rocket.Chat/pull/34209)) Fixed the data structure of the features preview

- <details><summary>Updated dependencies [76f6239ff1a9f34f163c03c140c4ceba62563b4e, 76f6239ff1a9f34f163c03c140c4ceba62563b4e, 76f6239ff1a9f34f163c03c140c4ceba62563b4e]:</summary>
  - @rocket.chat/ui-contexts@14.0.0-rc.0
  - @rocket.chat/ui-avatar@10.0.0-rc.0

  </details>

## 13.0.0

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@13.0.0
  - @rocket.chat/ui-avatar@9.0.0

  </details>

## 13.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@13.0.0-rc.3
  - @rocket.chat/ui-avatar@9.0.0-rc.3

  </details>

## 13.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@13.0.0-rc.2
  - @rocket.chat/ui-avatar@9.0.0-rc.2

  </details>

## 13.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@13.0.0-rc.1
  - @rocket.chat/ui-avatar@9.0.0-rc.1

  </details>

## 13.0.0-rc.0

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@13.0.0-rc.0
  - @rocket.chat/ui-avatar@9.0.0-rc.0

  </details>

## 12.0.0

### Minor Changes

- ([#33592](https://github.com/RocketChat/Rocket.Chat/pull/33592)) Adds ability to collapse/expand sidebar groups

### Patch Changes

- ([#33346](https://github.com/RocketChat/Rocket.Chat/pull/33346)) Implements integration with FreeSwitch to enable VoIP calls for team collaboration workspaces

- ([#33507](https://github.com/RocketChat/Rocket.Chat/pull/33507)) Fixed an issue where "Filter by room type" was selectable in the Rooms filter.

- <details><summary>Updated dependencies [9274cf4586]:</summary>
  - @rocket.chat/ui-avatar@8.0.0
  - @rocket.chat/ui-contexts@12.0.0

  </details>

## 12.0.0-rc.6

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@12.0.0-rc.6
  - @rocket.chat/ui-avatar@8.0.0-rc.6

  </details>

## 12.0.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@12.0.0-rc.5
  - @rocket.chat/ui-avatar@8.0.0-rc.5

  </details>

## 12.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@12.0.0-rc.4
  - @rocket.chat/ui-avatar@8.0.0-rc.4

  </details>

## 12.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@12.0.0-rc.3
  - @rocket.chat/ui-avatar@8.0.0-rc.3

  </details>

## 12.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@12.0.0-rc.2
  - @rocket.chat/ui-avatar@8.0.0-rc.2

  </details>

## 12.0.0-rc.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@12.0.0-rc.1
  - @rocket.chat/ui-avatar@8.0.0-rc.1

  </details>

## 12.0.0-rc.0

### Minor Changes

- ([#33592](https://github.com/RocketChat/Rocket.Chat/pull/33592)) Adds ability to collapse/expand sidebar groups

### Patch Changes

- ([#33346](https://github.com/RocketChat/Rocket.Chat/pull/33346)) Implements integration with FreeSwitch to enable VoIP calls for team collaboration workspaces

- ([#33507](https://github.com/RocketChat/Rocket.Chat/pull/33507)) Fixed an issue where "Filter by room type" was selectable in the Rooms filter.

- <details><summary>Updated dependencies [9274cf4586]:</summary>
  - @rocket.chat/ui-avatar@8.0.0-rc.0
  - @rocket.chat/ui-contexts@12.0.0-rc.0

  </details>

## 11.0.0

### Minor Changes

- ([#33156](https://github.com/RocketChat/Rocket.Chat/pull/33156)) added `sidepanelNavigation` to feature preview list

- ([#32821](https://github.com/RocketChat/Rocket.Chat/pull/32821)) Replaced new `SidebarV2` components under feature preview

- ([#33212](https://github.com/RocketChat/Rocket.Chat/pull/33212)) Added new Admin Feature Preview management view, this will allow the workspace admins to both enable feature previewing in the workspace as well as define which feature previews are enabled by default for the users in the workspace.

- ([#33225](https://github.com/RocketChat/Rocket.Chat/pull/33225)) Implemented new feature preview for Sidepanel

### Patch Changes

- <details><summary>Updated dependencies [cd0d50016e]:</summary>
  - @rocket.chat/ui-avatar@7.0.0
  - @rocket.chat/ui-contexts@11.0.0

  </details>

## 11.0.0-rc.5

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@11.0.0-rc.5
  - @rocket.chat/ui-avatar@7.0.0-rc.5

  </details>

## 11.0.0-rc.4

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@11.0.0-rc.4
  - @rocket.chat/ui-avatar@7.0.0-rc.4

  </details>

## 11.0.0-rc.3

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@11.0.0-rc.3
  - @rocket.chat/ui-avatar@7.0.0-rc.3

  </details>

## 11.0.0-rc.2

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@11.0.0-rc.2
  - @rocket.chat/ui-avatar@7.0.0-rc.2

  </details>

## 11.0.0-rc.1

### Minor Changes

- ([#33212](https://github.com/RocketChat/Rocket.Chat/pull/33212)) Added new Admin Feature Preview management view, this will allow the workspace admins to both enable feature previewing in the workspace as well as define which feature previews are enabled by default for the users in the workspace.

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@11.0.0-rc.1
  - @rocket.chat/ui-avatar@7.0.0-rc.1

  </details>

## 11.0.0-rc.0

### Minor Changes

- ([#33156](https://github.com/RocketChat/Rocket.Chat/pull/33156)) added `sidepanelNavigation` to feature preview list

- ([#32821](https://github.com/RocketChat/Rocket.Chat/pull/32821)) Replaced new `SidebarV2` components under feature preview

- ([#33225](https://github.com/RocketChat/Rocket.Chat/pull/33225)) Implemented new feature preview for Sidepanel

### Patch Changes

- <details><summary>Updated dependencies [cd0d50016e]:</summary>
  - @rocket.chat/ui-avatar@7.0.0-rc.0
  - @rocket.chat/ui-contexts@11.0.0-rc.0

  </details>

## 10.0.1

### Patch Changes

- <details><summary>Updated dependencies []:</summary>
  - @rocket.chat/ui-contexts@10.0.1

  </details>

## 10.0.0

### Patch Changes

- ([#32968](https://github.com/RocketChat/Rocket.Chat/pull/32968)) Bumped @rocket.chat/fuselage that fixes the Menu onPointerUp event behavior

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

- ([#32968](https://github.com/RocketChat/Rocket.Chat/pull/32968)) Bumped @rocket.chat/fuselage that fixes the Menu onPointerUp event behavior

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

### Minor Changes

- ([#32517](https://github.com/RocketChat/Rocket.Chat/pull/32517)) Feature Preview: New Navigation - `Header` and `Contextualbar` size improvements consistent with the new global `NavBar`

### Patch Changes

- ([#32024](https://github.com/RocketChat/Rocket.Chat/pull/32024)) Implemented a new tab to the users page called 'Active', this tab lists all users who have logged in for the first time and are active.

- <details><summary>Updated dependencies [2d89a0c448, 4e8aa575a6]:</summary>
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

### Minor Changes

- ([#32517](https://github.com/RocketChat/Rocket.Chat/pull/32517)) Feature Preview: New Navigation - `Header` and `Contextualbar` size improvements consistent with the new global `NavBar`

### Patch Changes

- ([#32024](https://github.com/RocketChat/Rocket.Chat/pull/32024)) Implemented a new tab to the users page called 'Active', this tab lists all users who have logged in for the first time and are active.

- <details><summary>Updated dependencies [2d89a0c448, 4e8aa575a6]:</summary>
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

- ([#31516](https://github.com/RocketChat/Rocket.Chat/pull/31516)) Room header keyboard navigability

  ![Kapture 2024-01-22 at 11 33 14](https://github.com/RocketChat/Rocket.Chat/assets/27704687/f116c1e6-4ec7-4175-a01b-fa98eade2416)

- ([#30680](https://github.com/RocketChat/Rocket.Chat/pull/30680)) feat: Skip to main content shortcut and useDocumentTitle

### Patch Changes

- ([#31138](https://github.com/RocketChat/Rocket.Chat/pull/31138)) feat(uikit): Move `@rocket.chat/ui-kit` package to the main monorepo

- <details><summary>Updated dependencies [b223cbde14, b2b0035162]:</summary>
  - @rocket.chat/ui-contexts@4.0.0

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

- 9cb97965ba: Room header keyboard navigability

  ![Kapture 2024-01-22 at 11 33 14](https://github.com/RocketChat/Rocket.Chat/assets/27704687/f116c1e6-4ec7-4175-a01b-fa98eade2416)

- dd5fd6d2c8: feat: Skip to main content shortcut and useDocumentTitle

### Patch Changes

- b223cbde14: feat(uikit): Move `@rocket.chat/ui-kit` package to the main monorepo
- Updated dependencies [b223cbde14]
- Updated dependencies [b2b0035162]
  - @rocket.chat/ui-contexts@4.0.0-rc.0

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

- Updated dependencies [7da1edf866]
  - @rocket.chat/ui-contexts@3.0.0

## 3.0.0-rc.19

### Patch Changes

- @rocket.chat/ui-contexts@3.0.0-rc.19

## 3.0.0-rc.18

### Patch Changes

- @rocket.chat/ui-contexts@3.0.0-rc.18

## 3.0.0-rc.17

### Patch Changes

- @rocket.chat/ui-contexts@3.0.0-rc.17

## 3.0.0-rc.16

### Patch Changes

- @rocket.chat/ui-contexts@3.0.0-rc.16

## 3.0.0-rc.15

### Patch Changes

- @rocket.chat/ui-contexts@3.0.0-rc.15

## 3.0.0-rc.14

### Patch Changes

- @rocket.chat/ui-contexts@3.0.0-rc.14

## 3.0.0-rc.13

### Patch Changes

- @rocket.chat/ui-contexts@3.0.0-rc.13

## 3.0.0-rc.12

### Patch Changes

- @rocket.chat/ui-contexts@3.0.0-rc.12

## 3.0.0-rc.11

### Patch Changes

- @rocket.chat/ui-contexts@3.0.0-rc.11

## 3.0.0-rc.10

### Patch Changes

- @rocket.chat/ui-contexts@3.0.0-rc.10

## 3.0.0-rc.9

### Patch Changes

- @rocket.chat/ui-contexts@3.0.0-rc.9

## 3.0.0-rc.8

### Patch Changes

- @rocket.chat/ui-contexts@3.0.0-rc.8

## 3.0.0-rc.7

### Patch Changes

- @rocket.chat/ui-contexts@3.0.0-rc.7

## 3.0.0-rc.6

### Patch Changes

- @rocket.chat/ui-contexts@3.0.0-rc.6

## 3.0.0-rc.5

### Patch Changes

- @rocket.chat/ui-contexts@3.0.0-rc.5

## 3.0.0-rc.4

### Patch Changes

- @rocket.chat/ui-contexts@3.0.0-rc.4

## 3.0.0-rc.3

### Patch Changes

- @rocket.chat/ui-contexts@3.0.0-rc.3

## 3.0.0-rc.2

### Patch Changes

- @rocket.chat/ui-contexts@3.0.0-rc.2

## 3.0.0-rc.1

### Patch Changes

- @rocket.chat/ui-contexts@3.0.0-rc.1

## 3.0.0-rc.0

### Patch Changes

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

### Minor Changes

- ebab8c4dd8: Added Reports Metrics Dashboard to Omnichannel
- ee3815fce4: feat: add ChangePassword field to Account/Security

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

### Minor Changes

- ebab8c4dd8: Added Reports Metrics Dashboard to Omnichannel
- ee3815fce4: feat: add ChangePassword field to Account/Security

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

### Patch Changes

- e14ec50816: Added and Improved Custom Fields form to Registration Flow
- baaa38f7f4: Fixed required custom fields considering blank spaces as valid.
- f76d514341: Implemented a visual password verification in the Register User form, My Profile page, and reset password page. With this, the user will know exactly why their password is weak and how to improve it.
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

### Patch Changes

- e14ec50816: Added and Improved Custom Fields form to Registration Flow
- baaa38f7f4: Fixed required custom fields considering blank spaces as valid.
- Updated dependencies [e14ec50816]
  - @rocket.chat/ui-contexts@1.0.0-rc.0
