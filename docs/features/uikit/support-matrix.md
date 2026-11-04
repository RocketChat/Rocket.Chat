<!-- Snapshot of the code as of October 2026. Update it by hand when you change a block type, a surface union or a renderer. -->

# UiKit support matrix

Which layout blocks each surface accepts, and which renderer draws them.

Each surface has one list of accepted layout blocks, exported by `@rocket.chat/ui-kit` (`messageSurfaceLayoutBlockTypes`, `modalSurfaceLayoutBlockTypes`, `bannerSurfaceLayoutBlockTypes`, `contextualBarSurfaceLayoutBlockTypes`, `attachmentSurfaceLayoutBlockTypes`). The surface layout type is derived from that list, the `UiKitParser*` class passes it to `SurfaceRenderer`, and the matching Fuselage renderer passes it too, where one exists. The `ui-kit` spec checks that each parser lets through exactly its list; the Fuselage spec checks that each renderer has a method for every block in it. Apps do not see the lists at compile time: the apps-engine types every surface and message as `Array<IBlock | LayoutBlock>`.

`conditional` is omitted: it is unwrapped before the list is checked.

## Divergences

- **Livechat, message blocks**: `file`, `info_card`, `input`, `rich_text` and `video_conf` are accepted, but Livechat's `MessageParser` has no method for them, so they render as nothing in the widget. `info_card` needs icons the widget does not ship, and `video_conf` needs the call UI of the web client.
- **Livechat, simplified drawing**: `context_actions` shows an emoji (feedback) or the label (icon button) instead of an icon; `multi_static_select` is a native multiple `<select>` that ignores `maxSelectItems`; `video` frames only absolute `https` URLs and `markdown` and `table` cells use the widget's own Markdown renderer.
- **Livechat, modals**: the widget draws modal views with `actions`, `callout`, `context`, `divider`, `header`, `image`, `markdown`, `preview`, `section`, `table`, `video` and `input` blocks. `input` supports `plain_text_input`, `static_select`, `multi_static_select` and `datepicker`; other input elements render as nothing. Contextual bars, banners and `tab_navigation` are not drawn.
- **`attachment` surface**: has a parser and a list, but no client renderer.
- **`feedback_buttons` and `icon_button` outside their containers**: the types only allow them in the containers marked below, but the Fuselage renderer draws them in any element container, so a `feedback_buttons` inside an `actions` block still renders in a message.

## Layout blocks per surface

✅ means the block is in the surface's list, so the type, the `ui-kit` parser and the Fuselage renderer all accept it. The attachment surface has no Fuselage renderer, so its ✅ only means the block is in the list. The Livechat column covers message blocks in the Livechat widget.

| Block | message | Livechat (message) | modal | banner | contextualBar | attachment |
| --- | --- | --- | --- | --- | --- | --- |
| `actions` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `callout` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `context` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `context_actions` | ✅ | ✅ | — | — | — | — |
| `divider` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `file` | ✅ | — | — | — | — | — |
| `header` | ✅ | ✅ | ✅ | — | ✅ | — |
| `image` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `info_card` | ✅ | — | — | ✅ | — | — |
| `input` | ✅ | — | ✅ | ✅ | ✅ | — |
| `markdown` | ✅ | ✅ | ✅ | — | ✅ | — |
| `preview` | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| `rich_text` | ✅ | — | ✅ | — | ✅ | — |
| `section` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `tab_navigation` | — | — | — | — | ✅ | — |
| `table` | ✅ | ✅ | ✅ | — | ✅ | — |
| `video` | ✅ | ✅ | ✅ | — | ✅ | — |
| `video_conf` | ✅ | — | — | — | — | — |

`file_input` needs a room to store the files in, so it only works in a modal or contextual bar opened from a conversation; in a banner, or a modal opened with no room on screen, it renders disabled.

`input` in a message has no view state to submit to: its elements only reach the app through `dispatchActionConfig` (see [interactions.md](interactions.md#when-an-element-sends-blockaction)).

The attachment surface has no client renderer, so its column is the list only.

## Elements per container

Container columns come from the block types; renderer columns tell whether a method exists to draw the element.

| Element | actions | input | section accessory | context | context_actions | callout accessory | info_card row | info_card action | tab_navigation | Fuselage renders | Livechat renders |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `button` | ✅ | — | ✅ | — | — | ✅ | — | — | — | ✅ | ✅ |
| `channels_select` | ✅ | ✅ | ✅ | — | — | — | — | — | — | ✅ | — |
| `checkbox` | ✅ | ✅ | ✅ | — | — | — | — | — | — | ✅ | — |
| `conversations_select` | ✅ | ✅ | ✅ | — | — | — | — | — | — | ✅ | — |
| `datepicker` | ✅ | ✅ | ✅ | — | — | — | — | — | — | ✅ | ✅ |
| `datetimepicker` | ✅ | ✅ | — | — | — | — | — | — | — | ✅ | — |
| `email_text_input` | — | ✅ | — | — | — | — | — | — | — | ✅ | — |
| `external_select` | ✅ | ✅ | ✅ | — | — | — | — | — | — | ✅ | — |
| `feedback_buttons` | — | — | — | — | ✅ | — | — | — | — | ✅ | ✅ |
| `file_input` | — | ✅ | — | — | — | — | — | — | — | ✅ | — |
| `icon` | — | — | — | — | — | — | ✅ | — | — | ✅ | — |
| `icon_button` | — | — | — | — | ✅ | — | — | ✅ | — | ✅ | ✅ |
| `image` | — | — | ✅ | ✅ | — | — | — | — | — | ✅ | ✅ |
| `linear_scale` | ✅ | ✅ | — | — | — | — | — | — | — | ✅ | — |
| `multi_channels_select` | ✅ | ✅ | ✅ | — | — | — | — | — | — | ✅ | — |
| `multi_conversations_select` | ✅ | ✅ | ✅ | — | — | — | — | — | — | ✅ | — |
| `multi_external_select` | ✅ | ✅ | ✅ | — | — | — | — | — | — | ✅ | — |
| `multi_static_select` | ✅ | ✅ | ✅ | — | — | — | — | — | — | ✅ | ✅ |
| `multi_users_select` | ✅ | ✅ | ✅ | — | — | — | — | — | — | ✅ | — |
| `number_input` | — | ✅ | — | — | — | — | — | — | — | ✅ | — |
| `overflow` | ✅ | — | ✅ | — | — | ✅ | — | — | — | ✅ | ✅ |
| `plain_text_input` | — | ✅ | — | — | — | — | — | — | — | ✅ | ✅ (modal only) |
| `radio_button` | ✅ | ✅ | ✅ | — | — | — | — | — | — | ✅ | — |
| `rich_text_input` | — | ✅ | — | — | — | — | — | — | — | ✅ | — |
| `static_select` | ✅ | ✅ | ✅ | — | — | — | — | — | — | ✅ | ✅ |
| `tab` (via `tab_navigation`) | — | — | — | — | — | — | — | — | ✅ | ✅ | — |
| `time_picker` | ✅ | ✅ | ✅ | — | — | — | — | — | — | ✅ | — |
| `toggle_switch` | ✅ | ✅ | — | — | — | — | — | — | — | ✅ | — |
| `url_text_input` | — | ✅ | — | — | — | — | — | — | — | ✅ | — |
| `users_select` | ✅ | ✅ | ✅ | — | — | — | — | — | — | ✅ | — |
