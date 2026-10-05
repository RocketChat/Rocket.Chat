# Parity with Slack Block Kit

UiKit borrows Block Kit's vocabulary (blocks, elements, text objects, surfaces) but is not wire-compatible with it. This page tracks the differences so Plan B work can be prioritised. Rocket.Chat's side is checked against the code. Slack's side is from Block Kit's public docs as of mid-2026; items marked †, which Slack added recently, should be checked against <https://api.slack.com/block-kit> before you act on them.

## Wire format

| | Block Kit | UiKit |
| --- | --- | --- |
| Field names | `snake_case` (`action_id`, `image_url`, `initial_option`) | `camelCase` (`actionId`, `imageUrl`, `initialOption`) |
| Tag names | `checkboxes`, `radio_buttons`, `timepicker` | `checkbox`, `radio_button`, `time_picker` |
| Markdown | Slack mrkdwn | Rocket.Chat message markdown (see [text-objects.md](text-objects.md)) |

A Block Kit payload therefore cannot be sent to UiKit unchanged, even for blocks both sides have.

## Layout blocks

| Block Kit | UiKit | Status |
| --- | --- | --- |
| `section`, `divider`, `image`, `actions`, `context`, `input` | same names | Present; field gaps below |
| `header` | — | Missing |
| `rich_text` (sections, lists, quotes, preformatted, inline mentions) | — | Missing. The `@rocket.chat/message-parser` AST could back it. |
| `markdown` † | — | Missing |
| `table` † | — | Missing. The message parser already handles GFM tables. |
| `video` | `preview` with `oembedUrl` | Partial |
| `file` (remote file) | — | Missing |
| `context_actions` with `feedback_buttons` † | — | Missing |
| — | `callout`, `info_card`, `preview`, `video_conf`, `conditional`, `tab_navigation` | UiKit only |

## Elements

| Block Kit | UiKit | Status |
| --- | --- | --- |
| `button`, `overflow`, `datepicker`, `plain_text_input`, `image` | same | Present |
| `checkboxes`, `radio_buttons`, `timepicker` | `checkbox`, `radio_button`, `time_picker` | Present, renamed |
| `static_select`, `users_select`, `channels_select` and their `multi_` forms | same | Present; field gaps below |
| `conversations_select`, `multi_conversations_select` | declared `@todo` | Typed but never rendered |
| `external_select`, `multi_external_select` | — | Missing; needs a suggestion interaction |
| `datetimepicker` | — | Missing |
| `number_input`, `email_text_input`, `url_text_input` | — | Missing |
| `rich_text_input` | — | Missing |
| `file_input` | — | Missing |
| `workflow_button` | — | Not applicable |
| — | `linear_scale`, `toggle_switch`, `icon`, `icon_button`, `tab` | UiKit only |

## Field gaps on shared elements

- **Users and channels selects** only take `placeholder`. Missing: initial value(s), `default_to_current_conversation`, conversation `filter`, `max_selected_items`, `response_url_enabled`.
- **All inputs**: no `focus_on_load`.
- **`button`**: no `accessibility_label`. `url` is not validated (there is a `TODO` in `ButtonElement.ts`).
- **`section`**: `accessory` accepts only button, datepicker, image, static selects and overflow (Block Kit also allows checkboxes, radio buttons, timepicker and the users/channels/conversations selects); no `expand`.
- **`input`**: no block-level `dispatch_action`; UiKit configures dispatch per element through `dispatchActionConfig`.
- **`image`**: URL only; no reference to an uploaded file.
- **Limits**: no type enforces block counts, text lengths or option counts, all of which Block Kit documents.

## Surfaces and interactions

| Block Kit | UiKit |
| --- | --- |
| Messages | Present |
| Modals | Present. No view stack (`views.push`). `private_metadata`, `callback_id`, `external_id` and `submit_disabled` are missing. `clearOnClose` and `notifyOnClose` are declared on the apps-engine `IUIKitSurface`, but nothing reads them. |
| `view_submission` `response_action` | Only `errors`; no `update`, `push` or `clear` |
| App Home tab | `UIKitSurfaceType.HOME` is declared in apps-engine but not implemented. The contextual bar is the closest existing surface. |
| `block_suggestion` (options for external selects) | Missing |
| — | Banner and contextual bar surfaces, `i18n` on text objects, per-engine `conditional` blocks (UiKit only) |

## Inconsistencies inside UiKit

Independent of Block Kit, the types, the `ui-kit` parsers and the renderers disagree on several surfaces. [support-matrix.md](support-matrix.md#divergences) generates the current list on every change.
