<!-- Snapshot of the code as of October 2026. Update it by hand when you change a block type, a surface union or a renderer. -->

# UiKit support matrix

Which layout blocks each surface accepts, and which renderer draws them.

Each surface has one list of accepted layout blocks, exported by `@rocket.chat/ui-kit` (`messageSurfaceLayoutBlockTypes`, `modalSurfaceLayoutBlockTypes`, `bannerSurfaceLayoutBlockTypes`, `contextualBarSurfaceLayoutBlockTypes`, `attachmentSurfaceLayoutBlockTypes`). The surface layout type is derived from that list, the `UiKitParser*` class passes it to `SurfaceRenderer`, and the matching Fuselage renderer passes it too. Spec files in both packages fail when a parser or a Fuselage renderer stops honouring its list. Apps do not see the lists at compile time: the apps-engine types every surface and message as `LayoutBlock[]`.

`conditional` is omitted: it is unwrapped before the list is checked.

## Divergences

- **Livechat, message blocks**: `callout`, `info_card`, `input`, `preview` and `video_conf` are accepted, but Livechat's `MessageParser` has no method for them, so they render as nothing in the widget.
- **element `conversations_select`** and **`multi_conversations_select`**: accepted by `actions` and `input`, but no renderer has a method for them, so they never render.
- **element `multi_static_select` in Livechat**: the method exists but returns `null`.
- **`attachment` surface**: has a parser and a list, but no client renderer.

## Layout blocks per surface

✅ means the block is in the surface's list, so the type, the `ui-kit` parser and the Fuselage renderer all accept it. The Livechat column covers message blocks in the Livechat widget.

| Block | message | Livechat (message) | modal | banner | contextualBar | attachment |
| --- | --- | --- | --- | --- | --- | --- |
| `actions` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `callout` | ✅ | — | ✅ | ✅ | ✅ | ✅ |
| `context` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `divider` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `image` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `info_card` | ✅ | — | — | ✅ | — | — |
| `input` | ✅ | — | ✅ | ✅ | ✅ | — |
| `preview` | ✅ | — | ✅ | ✅ | ✅ | — |
| `section` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `tab_navigation` | — | — | — | — | ✅ | — |
| `video_conf` | ✅ | — | — | — | — | — |

`input` in a message has no view state to submit to: its elements only reach the app through `dispatchActionConfig` (see [interactions.md](interactions.md#when-an-element-sends-blockaction)).

The attachment surface has no client renderer, so its column is the list only.

## Elements per container

Container columns come from the block types; renderer columns tell whether a method exists to draw the element.

| Element | actions | input | section accessory | context | callout accessory | info_card row | info_card action | tab_navigation | Fuselage renders | Livechat renders |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `button` | ✅ | — | ✅ | — | ✅ | — | — | — | ✅ | ✅ |
| `channels_select` | ✅ | ✅ | — | — | — | — | — | — | ✅ | — |
| `checkbox` | ✅ | ✅ | — | — | — | — | — | — | ✅ | — |
| `conversations_select` | ✅ | ✅ | — | — | — | — | — | — | — | — |
| `datepicker` | ✅ | ✅ | ✅ | — | — | — | — | — | ✅ | ✅ |
| `icon` | — | — | — | — | — | ✅ | — | — | ✅ | — |
| `icon_button` | — | — | — | — | — | — | ✅ | — | ✅ | — |
| `image` | — | — | ✅ | ✅ | — | — | — | — | ✅ | ✅ |
| `linear_scale` | ✅ | ✅ | — | — | — | — | — | — | ✅ | — |
| `multi_channels_select` | ✅ | ✅ | — | — | — | — | — | — | ✅ | — |
| `multi_conversations_select` | ✅ | ✅ | — | — | — | — | — | — | — | — |
| `multi_static_select` | ✅ | ✅ | ✅ | — | — | — | — | — | ✅ | — (returns `null`) |
| `multi_users_select` | ✅ | ✅ | — | — | — | — | — | — | ✅ | — |
| `overflow` | ✅ | — | ✅ | — | ✅ | — | — | — | ✅ | ✅ |
| `plain_text_input` | — | ✅ | — | — | — | — | — | — | ✅ | — |
| `radio_button` | ✅ | ✅ | — | — | — | — | — | — | ✅ | — |
| `static_select` | ✅ | ✅ | ✅ | — | — | — | — | — | ✅ | ✅ |
| `tab` (via `tab_navigation`) | — | — | — | — | — | — | — | ✅ | ✅ | — |
| `time_picker` | ✅ | ✅ | — | — | — | — | — | — | ✅ | — |
| `toggle_switch` | ✅ | ✅ | — | — | — | — | — | — | ✅ | — |
| `users_select` | ✅ | ✅ | — | — | — | — | — | — | ✅ | — |
