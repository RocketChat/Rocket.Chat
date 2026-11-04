<!-- Snapshot of the code as of October 2026. Update it by hand when you change a block type, a surface union or a renderer. -->

# UiKit reference

Every block, element, text object, composition object and view that `@rocket.chat/ui-kit` defines, with its fields as the types declare them. For where each one is accepted and rendered, see [support-matrix.md](support-matrix.md).

## Layout blocks

### `actions`

Source: [`packages/ui-kit/src/blocks/layout/ActionsBlock.ts`](../../../packages/ui-kit/src/blocks/layout/ActionsBlock.ts)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `'actions'` | yes |  |
| `elements` | `readonly ( \| ButtonElement \| ChannelsSelectElement \| ConversationsSelectElement \| DatePickerElement \| DateTimePickerElement \| LinearScaleElement \| MultiChannelsSelectElement \| MultiConversationsSelectElement \| MultiStaticSelectElement \| MultiUsersSelectElement \| OverflowElement \| StaticSelectElement \| UsersSelectElement \| ToggleSwitchElement \| CheckboxElement \| RadioButtonElement \| RichTextInputElement \| TimePickerElement )[]` | yes |  |
| `elements` | `readonly ( \| ButtonElement \| ChannelsSelectElement \| ConversationsSelectElement \| DatePickerElement \| DateTimePickerElement \| ExternalSelectElement \| LinearScaleElement \| MultiChannelsSelectElement \| MultiConversationsSelectElement \| MultiExternalSelectElement \| MultiStaticSelectElement \| MultiUsersSelectElement \| OverflowElement \| StaticSelectElement \| UsersSelectElement \| ToggleSwitchElement \| CheckboxElement \| RadioButtonElement \| TimePickerElement )[]` | yes |  |
| `appId` | `string` | no |  |
| `blockId` | `string` | no |  |

### `callout`

Source: [`packages/ui-kit/src/blocks/layout/CalloutBlock.ts`](../../../packages/ui-kit/src/blocks/layout/CalloutBlock.ts)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `'callout'` | yes |  |
| `title` | `TextObject` | no |  |
| `text` | `TextObject` | yes |  |
| `variant` | `'info' \| 'danger' \| 'warning' \| 'success'` | no |  |
| `accessory` | `ButtonElement \| OverflowElement` | no |  |
| `appId` | `string` | no |  |
| `blockId` | `string` | no |  |

### `conditional`

Source: [`packages/ui-kit/src/blocks/layout/ConditionalBlock.ts`](../../../packages/ui-kit/src/blocks/layout/ConditionalBlock.ts)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `'conditional'` | yes |  |
| `when` | `{ [K in keyof Conditions]: readonly Conditions[K][]; }` | no |  |
| `render` | `readonly RenderableLayoutBlock[]` | yes |  |
| `appId` | `string` | no |  |
| `blockId` | `string` | no |  |

### `context`

Source: [`packages/ui-kit/src/blocks/layout/ContextBlock.ts`](../../../packages/ui-kit/src/blocks/layout/ContextBlock.ts)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `'context'` | yes |  |
| `elements` | `readonly ContextBlockElements[]` | yes |  |
| `appId` | `string` | no |  |
| `blockId` | `string` | no |  |

### `context_actions`

Source: [`packages/ui-kit/src/blocks/layout/ContextActionsBlock.ts`](../../../packages/ui-kit/src/blocks/layout/ContextActionsBlock.ts)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `'context_actions'` | yes | A compact row of actions about the message it closes, such as copying or reporting it. |
| `elements` | `readonly (FeedbackButtonsElement \| IconButtonElement)[]` | yes | Each element gets the block's `appId` and `blockId` when it has none. |
| `appId` | `string` | no |  |
| `blockId` | `string` | no |  |

### `divider`

Source: [`packages/ui-kit/src/blocks/layout/DividerBlock.ts`](../../../packages/ui-kit/src/blocks/layout/DividerBlock.ts)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `'divider'` | yes |  |
| `appId` | `string` | no |  |
| `blockId` | `string` | no |  |

### `header`

Source: [`packages/ui-kit/src/blocks/layout/HeaderBlock.ts`](../../../packages/ui-kit/src/blocks/layout/HeaderBlock.ts)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `'header'` | yes | A large title that separates sections of a surface. |
| `text` | `PlainText` | yes |  |
| `appId` | `string` | no |  |
| `blockId` | `string` | no |  |

### `image`

Source: [`packages/ui-kit/src/blocks/layout/ImageBlock.ts`](../../../packages/ui-kit/src/blocks/layout/ImageBlock.ts)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `'image'` | yes |  |
| `imageUrl` | `string` | yes |  |
| `altText` | `string` | yes |  |
| `title` | `PlainText` | no |  |
| `appId` | `string` | no |  |
| `blockId` | `string` | no |  |

### `file`

Source: [`packages/ui-kit/src/blocks/layout/FileBlock.ts`](../../../packages/ui-kit/src/blocks/layout/FileBlock.ts)

An uploaded file shown as a card with a link to download it. The card shows a generic "File" label, not the file name, size or type: the client fetches no file details. The link is the file URL, which enforces room access, so a viewer who cannot read the file gets a `403` when they open it. Only files of the workspace are supported: any `source` other than `local` renders nothing.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `'file'` | yes |  |
| `file_id` | `string` | yes |  |
| `source` | `'local'` | no |  |
| `appId` | `string` | no |  |
| `blockId` | `string` | no |  |

### `info_card`

Source: [`packages/ui-kit/src/blocks/layout/InfoCardBlock.ts`](../../../packages/ui-kit/src/blocks/layout/InfoCardBlock.ts)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `'info_card'` | yes |  |
| `rows` | `readonly InfoCardRow[]` | yes |  |
| `appId` | `string` | no |  |
| `blockId` | `string` | no |  |

### `input`

Source: [`packages/ui-kit/src/blocks/layout/InputBlock.ts`](../../../packages/ui-kit/src/blocks/layout/InputBlock.ts)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `'input'` | yes |  |
| `label` | `PlainText` | yes |  |
| `element` | `\| ChannelsSelectElement \| ConversationsSelectElement \| DatePickerElement \| DateTimePickerElement \| ExternalSelectElement \| LinearScaleElement \| MultiChannelsSelectElement \| MultiConversationsSelectElement \| MultiExternalSelectElement \| MultiStaticSelectElement \| MultiUsersSelectElement \| PlainTextInputElement \| NumberInputElement \| EmailTextInputElement \| UrlTextInputElement \| StaticSelectElement \| UsersSelectElement \| CheckboxElement \| RadioButtonElement \| TimePickerElement \| ToggleSwitchElement` | yes |  |
| `hint` | `PlainText` | no |  |
| `optional` | `boolean` | no |  |
| `appId` | `string` | no |  |
| `blockId` | `string` | no |  |

### `markdown`

Source: [`packages/ui-kit/src/blocks/layout/MarkdownBlock.ts`](../../../packages/ui-kit/src/blocks/layout/MarkdownBlock.ts)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `'markdown'` | yes | A longer piece of formatted text, written in Markdown, rendered like a chat message. |
| `text` | `string` | yes |  |
| `appId` | `string` | no |  |
| `blockId` | `string` | no |  |

### `preview`

Source: [`packages/ui-kit/src/blocks/layout/PreviewBlock.ts`](../../../packages/ui-kit/src/blocks/layout/PreviewBlock.ts)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `'preview'` | yes |  |
| `title` | `TextObject[]` | yes |  |
| `description` | `TextObject[]` | yes |  |
| `footer` | `ContextBlock` | no |  |
| `appId` | `string` | no |  |
| `blockId` | `string` | no |  |
| `thumb` | `Image` | no |  |
| `preview` | `Image` | no |  |
| `externalUrl` | `string` | no |  |
| `oembedUrl` | `string` | no |  |

### `rich_text`

Source: [`packages/ui-kit/src/blocks/layout/RichTextBlock.ts`](../../../packages/ui-kit/src/blocks/layout/RichTextBlock.ts)

Structured rich text. Fuselage maps it to the `@rocket.chat/message-parser` AST and renders it with the same `Markup` component as a chat message.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `'rich_text'` | yes |  |
| `elements` | `RichTextContainer[]` | yes | `rich_text_section`, `rich_text_list`, `rich_text_quote` or `rich_text_preformatted`. |
| `appId` | `string` | no |  |
| `blockId` | `string` | no |  |

Containers:

| Container | Fields |
| --- | --- |
| `rich_text_section` | `elements`: inline elements |
| `rich_text_list` | `style`: `'bullet'` or `'ordered'`; `indent?`: number; `elements`: `rich_text_section[]` |
| `rich_text_quote` | `elements`: inline elements |
| `rich_text_preformatted` | `elements`: inline elements, whose `text` is joined and shown as a code block |

Inline elements:

| Element | Fields |
| --- | --- |
| `text` | `text`; `style?`: `{ bold?, italic?, strike?, code? }` |
| `link` | `url`; `text?` (defaults to the url); `style?` |
| `emoji` | `name`; `unicode?` (shown instead of the shortcode when set) |
| `user` | `user_id`: resolved to the username through `/v1/users.info` |
| `channel` | `channel_id`: resolved to the room name through `/v1/rooms.info` |
| `date` | `timestamp`: Unix seconds; `format?`: `t`, `T`, `d`, `D`, `f` (default), `F` or `R` |
| `broadcast` | `range`: `'here'`, `'channel'` or `'everyone'`; the last two both mention `@all` |

Notes:

- Mentions arrive by id and are resolved on the client with cached requests; the id is shown until the name loads, and stays if the lookup fails.
- The message-parser AST has flat lists, so `indent` is ignored when rendering: a nested list shows at the top level.
- Only the message, modal and contextual bar surfaces accept it.

### `section`

Source: [`packages/ui-kit/src/blocks/layout/SectionBlock.ts`](../../../packages/ui-kit/src/blocks/layout/SectionBlock.ts)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `'section'` | yes |  |
| `text` | `TextObject` | no |  |
| `fields` | `readonly TextObject[]` | no |  |
| `accessory` | `ButtonElement \| ChannelsSelectElement \| CheckboxElement \| ConversationsSelectElement \| DatePickerElement \| ExternalSelectElement \| ImageElement \| MultiChannelsSelectElement \| MultiConversationsSelectElement \| MultiExternalSelectElement \| MultiStaticSelectElement \| MultiUsersSelectElement \| OverflowElement \| RadioButtonElement \| StaticSelectElement \| TimePickerElement \| UsersSelectElement` | no |  |
| `appId` | `string` | no |  |
| `blockId` | `string` | no |  |

### `table`

Source: [`packages/ui-kit/src/blocks/layout/TableBlock.ts`](../../../packages/ui-kit/src/blocks/layout/TableBlock.ts)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `'table'` | yes | Rows of cells shown as a table; the first row is the header. |
| `rows` | `readonly (readonly TableCell[])[]` | yes | A cell is `{ type: 'raw_text', text }`, shown as is, or a text object (`plain_text`, `mrkdwn`). Any other cell renders empty, and a row that is not a list renders no cells. |
| `column_settings` | `readonly ({ align?: 'left' \| 'center' \| 'right'; is_wrapped?: boolean } \| null)[]` | no | Settings for each column, by position; `null` keeps a column's defaults. Text is truncated unless `is_wrapped`. |
| `appId` | `string` | no |  |
| `blockId` | `string` | no |  |

### `tab_navigation`

Source: [`packages/ui-kit/src/blocks/layout/ExperimentalTabNavigationBlock.ts`](../../../packages/ui-kit/src/blocks/layout/ExperimentalTabNavigationBlock.ts)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `'tab_navigation'` | yes |  |
| `tabs` | `readonly ExperimentalTabElement[]` | yes |  |
| `appId` | `string` | no |  |
| `blockId` | `string` | no |  |

### `video`

Source: [`packages/ui-kit/src/blocks/layout/VideoBlock.ts`](../../../packages/ui-kit/src/blocks/layout/VideoBlock.ts)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `'video'` | yes | A video shown as its thumbnail, which plays in place once clicked. |
| `video_url` | `string` | yes | An embeddable page that plays the video, loaded in a sandboxed frame on click. Only absolute `https` URLs on another origin than the workspace play; relative URLs, other schemes and the workspace's own origin leave the thumbnail inert. |
| `thumbnail_url` | `string` | yes |  |
| `alt_text` | `string` | yes | Describes the video for screen readers and when the thumbnail does not load. |
| `title` | `PlainText` | yes |  |
| `title_url` | `string` | no | Opened in a new tab when the title is clicked. |
| `description` | `PlainText` | no |  |
| `author_name` | `string` | no |  |
| `provider_name` | `string` | no |  |
| `provider_icon_url` | `string` | no |  |
| `appId` | `string` | no |  |
| `blockId` | `string` | no |  |

### `video_conf`

Source: [`packages/ui-kit/src/blocks/layout/VideoConferenceBlock.ts`](../../../packages/ui-kit/src/blocks/layout/VideoConferenceBlock.ts)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `'video_conf'` | yes |  |
| `callId` | `string` | yes |  |
| `appId` | `string` | no |  |
| `blockId` | `string` | no |  |

## Block elements

### `button`

Source: [`packages/ui-kit/src/blocks/elements/ButtonElement.ts`](../../../packages/ui-kit/src/blocks/elements/ButtonElement.ts)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `'button'` | yes |  |
| `text` | `PlainText` | yes |  |
| `url` | `string` | no |  |
| `value` | `string` | no |  |
| `style` | `'primary' \| 'secondary' \| 'danger' \| 'warning' \| 'success'` | no |  |
| `secondary` | `boolean` | no |  |
| `accessibility_label` | `string` | no | What assistive technology announces instead of `text`, when the visible text alone is ambiguous. |
| `appId` | `string` | yes |  |
| `blockId` | `string` | yes |  |
| `actionId` | `string` | yes |  |
| `confirm` | `ConfirmationDialog` | no |  |
| `dispatchActionConfig` | `InputElementDispatchAction[]` | no |  |

### `channels_select`

Source: [`packages/ui-kit/src/blocks/elements/ChannelsSelectElement.ts`](../../../packages/ui-kit/src/blocks/elements/ChannelsSelectElement.ts)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `'channels_select'` | yes |  |
| `placeholder` | `PlainText` | no |  |
| `initial_channel` | `string` | no | Id of the room selected when the view opens. |
| `focus_on_load` | `boolean` | no | Focuses the field when the view opens. |
| `appId` | `string` | yes |  |
| `blockId` | `string` | yes |  |
| `actionId` | `string` | yes |  |
| `confirm` | `ConfirmationDialog` | no |  |
| `dispatchActionConfig` | `InputElementDispatchAction[]` | no |  |

### `checkbox`

Source: [`packages/ui-kit/src/blocks/elements/CheckboxElement.ts`](../../../packages/ui-kit/src/blocks/elements/CheckboxElement.ts)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `'checkbox'` | yes | Also accepted as `'checkboxes'`. |
| `options` | `Option[]` | yes |  |
| `initialOptions` | `Option[]` | no |  |
| `focus_on_load` | `boolean` | no | Focuses the field when the view opens (its first option). |
| `appId` | `string` | yes |  |
| `blockId` | `string` | yes |  |
| `actionId` | `string` | yes |  |
| `confirm` | `ConfirmationDialog` | no |  |
| `dispatchActionConfig` | `InputElementDispatchAction[]` | no |  |

### `conversations_select`

Source: [`packages/ui-kit/src/blocks/elements/ConversationsSelectElement.ts`](../../../packages/ui-kit/src/blocks/elements/ConversationsSelectElement.ts)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `'conversations_select'` | yes | Picks one conversation the user belongs to (channel, private group or direct message); the value is the room id. |
| `placeholder` | `PlainText` | no |  |
| `initial_conversation` | `string` | no | Id of the room selected when the view opens. |
| `default_to_current_conversation` | `boolean` | no | Starts with the conversation the view was opened from when nothing else is selected. Messages, contextual bars and modals use the room on screen; with no room open, or in a banner, nothing is preselected. |
| `filter` | `{ include?: ('public' \| 'private' \| 'im' \| 'mpim')[] }` | no | Which kinds of conversation to list: `im` is a direct message with one person, `mpim` one with several. |
| `focus_on_load` | `boolean` | no | Focuses the field when the view opens. |
| `appId` | `string` | yes |  |
| `blockId` | `string` | yes |  |
| `actionId` | `string` | yes |  |
| `confirm` | `ConfirmationDialog` | no |  |
| `dispatchActionConfig` | `InputElementDispatchAction[]` | no |  |

### `datepicker`

Source: [`packages/ui-kit/src/blocks/elements/DatePickerElement.ts`](../../../packages/ui-kit/src/blocks/elements/DatePickerElement.ts)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `'datepicker'` | yes |  |
| `placeholder` | `TextObject` | no |  |
| `initialDate` | `string` | no |  |
| `focus_on_load` | `boolean` | no | Focuses the field when the view opens. |
| `appId` | `string` | yes |  |
| `blockId` | `string` | yes |  |
| `actionId` | `string` | yes |  |
| `confirm` | `ConfirmationDialog` | no |  |
| `dispatchActionConfig` | `InputElementDispatchAction[]` | no |  |

### `datetimepicker`

Source: [`packages/ui-kit/src/blocks/elements/DateTimePickerElement.ts`](../../../packages/ui-kit/src/blocks/elements/DateTimePickerElement.ts)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `'datetimepicker'` | yes | Picks a date and a time together; the value is a Unix timestamp in seconds, shown in the user's time zone. |
| `initial_date_time` | `number` | no |  |
| `focus_on_load` | `boolean` | no | Focuses the field when the view opens. |
| `appId` | `string` | yes |  |
| `blockId` | `string` | yes |  |
| `actionId` | `string` | yes |  |
| `confirm` | `ConfirmationDialog` | no |  |
| `dispatchActionConfig` | `InputElementDispatchAction[]` | no |  |

### `email_text_input`

Source: [`packages/ui-kit/src/blocks/elements/EmailTextInputElement.ts`](../../../packages/ui-kit/src/blocks/elements/EmailTextInputElement.ts)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `'email_text_input'` | yes | A field for an email address. |
| `placeholder` | `PlainText` | no |  |
| `initial_value` | `string` | no |  |
| `focus_on_load` | `boolean` | no | Focuses the field when the view opens. |
| `appId` | `string` | yes |  |
| `blockId` | `string` | yes |  |
| `actionId` | `string` | yes |  |
| `confirm` | `ConfirmationDialog` | no |  |
| `dispatchActionConfig` | `InputElementDispatchAction[]` | no |  |

### `external_select`

Source: [`packages/ui-kit/src/blocks/elements/ExternalSelectElement.ts`](../../../packages/ui-kit/src/blocks/elements/ExternalSelectElement.ts)

The app provides the options as the user types: see [`blockSuggestion`](interactions.md#options-for-external-selects).

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `'external_select'` | yes |  |
| `placeholder` | `PlainText` | no |  |
| `initial_option` | `Option` | no | Option selected when the view opens. |
| `min_query_length` | `number` | no | Characters the user types before the app is asked for options. Defaults to 3. |
| `focus_on_load` | `boolean` | no | Focuses the field when the view opens. |
| `appId` | `string` | yes |  |
| `blockId` | `string` | yes |  |
| `actionId` | `string` | yes |  |
| `confirm` | `ConfirmationDialog` | no |  |
| `dispatchActionConfig` | `InputElementDispatchAction[]` | no |  |

### `feedback_buttons`

Source: [`packages/ui-kit/src/blocks/elements/FeedbackButtonsElement.ts`](../../../packages/ui-kit/src/blocks/elements/FeedbackButtonsElement.ts)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `'feedback_buttons'` | yes | A thumbs up and a thumbs down button, to rate the message they close. Typed only for `context_actions`; the renderer does not check the container, so it also draws inside other blocks such as `actions`. |
| `positive_button` | `FeedbackButton` | yes | `{ text: PlainText; value: string; accessibility_label?: string }`. `text` names the button and shows on hover; `accessibility_label` replaces it for screen readers. |
| `negative_button` | `FeedbackButton` | yes | Same shape as `positive_button`. |
| `appId` | `string` | yes |  |
| `blockId` | `string` | yes |  |
| `actionId` | `string` | yes |  |

A click sends a `blockAction` whose `value` is the clicked button's `value`, and marks that button as pressed. The pressed state lives only in the rendered message: it is gone after a reload or a room switch, and it stays even when the app fails to handle the action. An app that must not count a second rating dedupes by user and message, or replaces the block once rated.

### `icon`

Source: [`packages/ui-kit/src/blocks/elements/IconElement.ts`](../../../packages/ui-kit/src/blocks/elements/IconElement.ts)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `'icon'` | yes |  |
| `icon` | `AvailableIcons` | yes | One of `phone`, `phone-off`, `phone-issue`, `phone-question-mark`, `clock`, `arrow-forward`, `info`, `copy`, `flag`, `trash`, `edit`, `link`, `check`, `cross`, `star`, `pin`, `share`, `download`, `eye`, `bell`, `kebab`. |
| `variant` | `'default' \| 'danger' \| 'secondary' \| 'warning'` | yes |  |
| `framed` | `boolean` | no |  |

### `icon_button`

Source: [`packages/ui-kit/src/blocks/elements/IconButtonElement.ts`](../../../packages/ui-kit/src/blocks/elements/IconButtonElement.ts)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `'icon_button'` | yes |  |
| `icon` | `IconElement` | yes |  |
| `label` | `string` | no |  |
| `url` | `string` | no |  |
| `value` | `string` | no |  |
| `appId` | `string` | yes |  |
| `blockId` | `string` | yes |  |
| `actionId` | `string` | yes |  |
| `confirm` | `ConfirmationDialog` | no |  |
| `dispatchActionConfig` | `InputElementDispatchAction[]` | no |  |

### `image`

Source: [`packages/ui-kit/src/blocks/elements/ImageElement.ts`](../../../packages/ui-kit/src/blocks/elements/ImageElement.ts)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `'image'` | yes |  |
| `imageUrl` | `string` | yes |  |
| `altText` | `string` | yes |  |

### `file_input`

Source: [`packages/ui-kit/src/blocks/elements/FileInputElement.ts`](../../../packages/ui-kit/src/blocks/elements/FileInputElement.ts)

Lets the user attach files; the value in the view state is the list of the uploaded file IDs (`string[]`). Each file is uploaded when picked, as a temporary file of the room the view was opened from, and the app reads it with `IUploadRead` after the submit; see [interactions.md](interactions.md#files-in-views). Without a room, the element renders disabled.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `'file_input'` | yes |  |
| `filetypes` | `string[]` | no | Accepted extensions, without the dot (`pdf`, `png`). Any file is accepted when omitted. |
| `max_files` | `number` | no | Defaults to 10. |
| `appId` | `string` | yes |  |
| `blockId` | `string` | yes |  |
| `actionId` | `string` | yes |  |
| `confirm` | `ConfirmationDialog` | no |  |
| `dispatchActionConfig` | `InputElementDispatchAction[]` | no |  |

### `linear_scale`

Source: [`packages/ui-kit/src/blocks/elements/LinearScaleElement.ts`](../../../packages/ui-kit/src/blocks/elements/LinearScaleElement.ts)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `'linear_scale'` | yes |  |
| `minValue` | `number` | no |  |
| `maxValue` | `number` | no |  |
| `initialValue` | `number` | no |  |
| `preLabel` | `PlainText` | no |  |
| `postLabel` | `PlainText` | no |  |
| `appId` | `string` | yes |  |
| `blockId` | `string` | yes |  |
| `actionId` | `string` | yes |  |
| `confirm` | `ConfirmationDialog` | no |  |
| `dispatchActionConfig` | `InputElementDispatchAction[]` | no |  |

### `multi_channels_select`

Source: [`packages/ui-kit/src/blocks/elements/MultiChannelsSelectElement.ts`](../../../packages/ui-kit/src/blocks/elements/MultiChannelsSelectElement.ts)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `'multi_channels_select'` | yes |  |
| `placeholder` | `PlainText` | no |  |
| `initial_channels` | `string[]` | no | Ids of the rooms selected when the view opens. |
| `max_selected_items` | `number` | no | Most rooms that can be selected. |
| `focus_on_load` | `boolean` | no | Focuses the field when the view opens. |
| `appId` | `string` | yes |  |
| `blockId` | `string` | yes |  |
| `actionId` | `string` | yes |  |
| `confirm` | `ConfirmationDialog` | no |  |
| `dispatchActionConfig` | `InputElementDispatchAction[]` | no |  |

### `multi_conversations_select`

Source: [`packages/ui-kit/src/blocks/elements/MultiConversationsSelectElement.ts`](../../../packages/ui-kit/src/blocks/elements/MultiConversationsSelectElement.ts)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `'multi_conversations_select'` | yes | Picks several conversations the user belongs to; the value is the list of room ids. |
| `placeholder` | `PlainText` | no |  |
| `initial_conversations` | `string[]` | no | Ids of the rooms selected when the view opens. |
| `max_selected_items` | `number` | no | Most conversations that can be selected. |
| `default_to_current_conversation` | `boolean` | no | Starts with the conversation the view was opened from when nothing else is selected. Messages, contextual bars and modals use the room on screen; with no room open, or in a banner, nothing is preselected. |
| `filter` | `{ include?: ('public' \| 'private' \| 'im' \| 'mpim')[] }` | no | Which kinds of conversation to list: `im` is a direct message with one person, `mpim` one with several. |
| `focus_on_load` | `boolean` | no | Focuses the field when the view opens. |
| `appId` | `string` | yes |  |
| `blockId` | `string` | yes |  |
| `actionId` | `string` | yes |  |
| `confirm` | `ConfirmationDialog` | no |  |
| `dispatchActionConfig` | `InputElementDispatchAction[]` | no |  |

### `multi_external_select`

Source: [`packages/ui-kit/src/blocks/elements/MultiExternalSelectElement.ts`](../../../packages/ui-kit/src/blocks/elements/MultiExternalSelectElement.ts)

Like `external_select`, with several selections.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `'multi_external_select'` | yes |  |
| `placeholder` | `PlainText` | no |  |
| `initial_options` | `Option[]` | no | Options selected when the view opens. |
| `min_query_length` | `number` | no | Characters the user types before the app is asked for options. Defaults to 3. |
| `max_selected_items` | `number` | no | Most options that can be selected. |
| `focus_on_load` | `boolean` | no | Focuses the field when the view opens. |
| `appId` | `string` | yes |  |
| `blockId` | `string` | yes |  |
| `actionId` | `string` | yes |  |
| `confirm` | `ConfirmationDialog` | no |  |
| `dispatchActionConfig` | `InputElementDispatchAction[]` | no |  |

### `multi_static_select`

Source: [`packages/ui-kit/src/blocks/elements/MultiStaticSelectElement.ts`](../../../packages/ui-kit/src/blocks/elements/MultiStaticSelectElement.ts)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `'multi_static_select'` | yes |  |
| `placeholder` | `TextObject` | yes |  |
| `options` | `readonly Option[]` | yes |  |
| `optionGroups` | `readonly OptionGroup[]` | no |  |
| `maxSelectItems` | `number` | no |  |
| `initialValue` | `Option['value'][]` | no |  |
| `initialOption` | `Option[]` | no |  |
| `focus_on_load` | `boolean` | no | Focuses the field when the view opens. |
| `appId` | `string` | yes |  |
| `blockId` | `string` | yes |  |
| `actionId` | `string` | yes |  |
| `confirm` | `ConfirmationDialog` | no |  |
| `dispatchActionConfig` | `InputElementDispatchAction[]` | no |  |

### `multi_users_select`

Source: [`packages/ui-kit/src/blocks/elements/MultiUsersSelectElement.ts`](../../../packages/ui-kit/src/blocks/elements/MultiUsersSelectElement.ts)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `'multi_users_select'` | yes |  |
| `placeholder` | `PlainText` | no |  |
| `initial_users` | `string[]` | no | Usernames of the users selected when the view opens. |
| `max_selected_items` | `number` | no | Most users that can be selected. |
| `focus_on_load` | `boolean` | no | Focuses the field when the view opens. |
| `appId` | `string` | yes |  |
| `blockId` | `string` | yes |  |
| `actionId` | `string` | yes |  |
| `confirm` | `ConfirmationDialog` | no |  |
| `dispatchActionConfig` | `InputElementDispatchAction[]` | no |  |

### `number_input`

Source: [`packages/ui-kit/src/blocks/elements/NumberInputElement.ts`](../../../packages/ui-kit/src/blocks/elements/NumberInputElement.ts)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `'number_input'` | yes | A field that only takes numbers; the value is the number as typed, as a string. |
| `is_decimal_allowed` | `boolean` | yes |  |
| `placeholder` | `PlainText` | no |  |
| `initial_value` | `string` | no |  |
| `min_value` | `string` | no |  |
| `max_value` | `string` | no |  |
| `focus_on_load` | `boolean` | no | Focuses the field when the view opens. |
| `appId` | `string` | yes |  |
| `blockId` | `string` | yes |  |
| `actionId` | `string` | yes |  |
| `confirm` | `ConfirmationDialog` | no |  |
| `dispatchActionConfig` | `InputElementDispatchAction[]` | no |  |

### `overflow`

Source: [`packages/ui-kit/src/blocks/elements/OverflowElement.ts`](../../../packages/ui-kit/src/blocks/elements/OverflowElement.ts)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `'overflow'` | yes |  |
| `options` | `readonly Option[]` | yes |  |
| `appId` | `string` | yes |  |
| `blockId` | `string` | yes |  |
| `actionId` | `string` | yes |  |
| `confirm` | `ConfirmationDialog` | no |  |
| `dispatchActionConfig` | `InputElementDispatchAction[]` | no |  |

### `plain_text_input`

Source: [`packages/ui-kit/src/blocks/elements/PlainTextInputElement.ts`](../../../packages/ui-kit/src/blocks/elements/PlainTextInputElement.ts)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `'plain_text_input'` | yes |  |
| `placeholder` | `PlainText` | no |  |
| `initialValue` | `string` | no |  |
| `multiline` | `boolean` | no |  |
| `minLength` | `number` | no |  |
| `maxLength` | `number` | no |  |
| `focus_on_load` | `boolean` | no | Focuses the field when the view opens. |
| `appId` | `string` | yes |  |
| `blockId` | `string` | yes |  |
| `actionId` | `string` | yes |  |
| `confirm` | `ConfirmationDialog` | no |  |
| `dispatchActionConfig` | `InputElementDispatchAction[]` | no |  |

### `rich_text_input`

Source: [`packages/ui-kit/src/blocks/elements/RichTextInputElement.ts`](../../../packages/ui-kit/src/blocks/elements/RichTextInputElement.ts)

A multi-line field where the user types Markdown. Its value, in view state and in the payload sent to the app, is a `rich_text` block built by parsing the text the way a chat message is parsed. `initial_value` is converted back to Markdown for display.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `'rich_text_input'` | yes |  |
| `placeholder` | `PlainText` | no |  |
| `initial_value` | `RichTextBlock` | no |  |
| `focus_on_load` | `boolean` | no | Focuses the field when the view opens. |
| `appId` | `string` | yes |  |
| `blockId` | `string` | yes |  |
| `actionId` | `string` | yes |  |
| `confirm` | `ConfirmationDialog` | no |  |
| `dispatchActionConfig` | `InputElementDispatchAction[]` | no |  |

Typed `@name` and `#name` mentions have no ids on the client, so they come back as `text` elements; `@here` and `@all` become `broadcast` elements. A nested list comes back as separate `rich_text_list` containers with `indent` set to the depth.

### `radio_button`

Source: [`packages/ui-kit/src/blocks/elements/RadioButtonElement.ts`](../../../packages/ui-kit/src/blocks/elements/RadioButtonElement.ts)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `'radio_button'` | yes | Also accepted as `'radio_buttons'`. |
| `options` | `Option[]` | yes |  |
| `initialOption` | `Option` | no |  |
| `focus_on_load` | `boolean` | no | Focuses the field when the view opens (its first option). |
| `appId` | `string` | yes |  |
| `blockId` | `string` | yes |  |
| `actionId` | `string` | yes |  |
| `confirm` | `ConfirmationDialog` | no |  |
| `dispatchActionConfig` | `InputElementDispatchAction[]` | no |  |

### `static_select`

Source: [`packages/ui-kit/src/blocks/elements/StaticSelectElement.ts`](../../../packages/ui-kit/src/blocks/elements/StaticSelectElement.ts)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `'static_select'` | yes |  |
| `placeholder` | `TextObject` | yes |  |
| `options` | `readonly Option[]` | yes |  |
| `optionGroups` | `readonly OptionGroup[]` | no |  |
| `initialOption` | `Option` | no |  |
| `initialValue` | `Option['value']` | no |  |
| `focus_on_load` | `boolean` | no | Focuses the field when the view opens. |
| `appId` | `string` | yes |  |
| `blockId` | `string` | yes |  |
| `actionId` | `string` | yes |  |
| `confirm` | `ConfirmationDialog` | no |  |
| `dispatchActionConfig` | `InputElementDispatchAction[]` | no |  |

### `tab`

Source: [`packages/ui-kit/src/blocks/elements/ExperimentalTabElement.ts`](../../../packages/ui-kit/src/blocks/elements/ExperimentalTabElement.ts)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `'tab'` | yes |  |
| `title` | `TextObject` | yes |  |
| `disabled` | `boolean` | no |  |
| `selected` | `boolean` | no |  |
| `appId` | `string` | yes |  |
| `blockId` | `string` | yes |  |
| `actionId` | `string` | yes |  |
| `confirm` | `ConfirmationDialog` | no |  |
| `dispatchActionConfig` | `InputElementDispatchAction[]` | no |  |

### `time_picker`

Source: [`packages/ui-kit/src/blocks/elements/TimePickerElement.ts`](../../../packages/ui-kit/src/blocks/elements/TimePickerElement.ts)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `'time_picker'` | yes | Also accepted as `'timepicker'`. |
| `placeholder` | `TextObject` | no |  |
| `initialTime` | `string` | no |  |
| `timezone` | `string` | no | IANA name of the time zone `initialTime` and the picked time are in; the user's own when absent. The value sent stays `HH:mm`. |
| `focus_on_load` | `boolean` | no | Focuses the field when the view opens. |
| `appId` | `string` | yes |  |
| `blockId` | `string` | yes |  |
| `actionId` | `string` | yes |  |
| `confirm` | `ConfirmationDialog` | no |  |
| `dispatchActionConfig` | `InputElementDispatchAction[]` | no |  |

### `toggle_switch`

Source: [`packages/ui-kit/src/blocks/elements/ToggleSwitchElement.ts`](../../../packages/ui-kit/src/blocks/elements/ToggleSwitchElement.ts)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `'toggle_switch'` | yes |  |
| `options` | `Option[]` | yes |  |
| `initialOptions` | `Option[]` | no |  |
| `appId` | `string` | yes |  |
| `blockId` | `string` | yes |  |
| `actionId` | `string` | yes |  |
| `confirm` | `ConfirmationDialog` | no |  |
| `dispatchActionConfig` | `InputElementDispatchAction[]` | no |  |

### `url_text_input`

Source: [`packages/ui-kit/src/blocks/elements/UrlTextInputElement.ts`](../../../packages/ui-kit/src/blocks/elements/UrlTextInputElement.ts)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `'url_text_input'` | yes | A field for a URL. |
| `placeholder` | `PlainText` | no |  |
| `initial_value` | `string` | no |  |
| `focus_on_load` | `boolean` | no | Focuses the field when the view opens. |
| `appId` | `string` | yes |  |
| `blockId` | `string` | yes |  |
| `actionId` | `string` | yes |  |
| `confirm` | `ConfirmationDialog` | no |  |
| `dispatchActionConfig` | `InputElementDispatchAction[]` | no |  |

### `users_select`

Source: [`packages/ui-kit/src/blocks/elements/UsersSelectElement.ts`](../../../packages/ui-kit/src/blocks/elements/UsersSelectElement.ts)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `'users_select'` | yes |  |
| `placeholder` | `PlainText` | no |  |
| `initial_user` | `string` | no | Username of the user selected when the view opens. |
| `focus_on_load` | `boolean` | no | Focuses the field when the view opens. |
| `appId` | `string` | yes |  |
| `blockId` | `string` | yes |  |
| `actionId` | `string` | yes |  |
| `confirm` | `ConfirmationDialog` | no |  |
| `dispatchActionConfig` | `InputElementDispatchAction[]` | no |  |

## Text objects

### `mrkdwn`

Source: [`packages/ui-kit/src/blocks/text/Markdown.ts`](../../../packages/ui-kit/src/blocks/text/Markdown.ts)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `'mrkdwn'` | yes |  |
| `text` | `string` | yes |  |
| `verbatim` | `boolean` | no |  |
| `i18n` | `{ key: string; ns?: string; args?: { [key: string]: string \| number }; }` | no |  |

### `plain_text`

Source: [`packages/ui-kit/src/blocks/text/PlainText.ts`](../../../packages/ui-kit/src/blocks/text/PlainText.ts)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `'plain_text'` | yes |  |
| `text` | `string` | yes |  |
| `emoji` | `boolean` | no |  |
| `i18n` | `{ key: string; ns?: string; args?: { [key: string]: string \| number }; }` | no |  |

## Composition objects

### Option

Source: [`packages/ui-kit/src/blocks/Option.ts`](../../../packages/ui-kit/src/blocks/Option.ts)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `text` | `TextObject` | yes |  |
| `value` | `string` | yes |  |
| `description` | `PlainText` | no |  |
| `url` | `string` | no |  |

### OptionGroup

Source: [`packages/ui-kit/src/blocks/OptionGroup.ts`](../../../packages/ui-kit/src/blocks/OptionGroup.ts)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `label` | `PlainText` | yes |  |
| `options` | `Option[]` | yes |  |

### ConfirmationDialog

Source: [`packages/ui-kit/src/blocks/ConfirmationDialog.ts`](../../../packages/ui-kit/src/blocks/ConfirmationDialog.ts)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | `PlainText` | yes |  |
| `text` | `TextObject` | yes |  |
| `confirm` | `PlainText` | yes |  |
| `deny` | `PlainText` | yes |  |
| `style` | `'primary' \| 'danger'` | yes |  |

## Views

### ModalView

Source: [`packages/ui-kit/src/surfaces/modal/ModalView.ts`](../../../packages/ui-kit/src/surfaces/modal/ModalView.ts)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `appId` | `string` | yes | The ID of the app that created this view. |
| `id` | `string` | yes |  |
| `showIcon` | `boolean` | no |  |
| `title` | `TextObject` | yes |  |
| `close` | `ButtonElement` | no |  |
| `submit` | `ButtonElement` | no |  |
| `blocks` | `ModalSurfaceLayout` | yes |  |
| `private_metadata` | `string` | no | Data the app gets back on submit and close. Kept on the server; whatever the client sends for it is ignored. |
| `callback_id` | `string` | no | An id the app picks to recognize the view in its handlers. |
| `external_id` | `string` | no | An id the app picks, unique among the views it opened for a user. An update that carries it, and no known `id`, updates that view. |
| `submit_disabled` | `boolean` | no | Disables the submit button. |
| `hash` | `string` | no | Set by the server on every save. An update that carries a different `hash` is stale and is dropped. |
| `clearOnClose` | `boolean` | no | Closing the view closes every modal of the app (modal only). |
| `notifyOnClose` | `boolean` | no | Whether closing the view sends `viewClosed` to the app. Defaults to `true`, so views that do not set it keep notifying. |

### BannerView

Source: [`packages/ui-kit/src/surfaces/banner/BannerView.ts`](../../../packages/ui-kit/src/surfaces/banner/BannerView.ts)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `appId` | `string` | yes | The ID of the app that created this view. |
| `viewId` | `string` | yes |  |
| `inline` | `boolean` | no |  |
| `variant` | `'neutral' \| 'info' \| 'success' \| 'warning' \| 'danger'` | no |  |
| `icon` | `IconName` | no |  |
| `title` | `string \| TextObject` | no | Title as plain string (legacy) or UiKit text object (e.g. { type: 'mrkdwn', text: '...' }). |
| `blocks` | `BannerSurfaceLayout` | yes |  |

### ContextualBarView

Source: [`packages/ui-kit/src/surfaces/contextualBar/ContextualBarView.ts`](../../../packages/ui-kit/src/surfaces/contextualBar/ContextualBarView.ts)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `appId` | `string` | yes | The ID of the app that created this view. |
| `id` | `string` | yes |  |
| `title` | `TextObject` | yes |  |
| `close` | `ButtonElement` | no |  |
| `submit` | `ButtonElement` | no |  |
| `blocks` | `ContextualBarSurfaceLayout` | yes |  |
| `private_metadata` | `string` | no | Data the app gets back on submit and close. Kept on the server; whatever the client sends for it is ignored. |
| `callback_id` | `string` | no | An id the app picks to recognize the view in its handlers. |
| `external_id` | `string` | no | An id the app picks, unique among the views it opened for a user. An update that carries it, and no known `id`, updates that view. |
| `submit_disabled` | `boolean` | no | Disables the submit button. |
| `hash` | `string` | no | Set by the server on every save. An update that carries a different `hash` is stale and is dropped. |
| `clearOnClose` | `boolean` | no | Closing the view closes every modal of the app (modal only). |
| `notifyOnClose` | `boolean` | no | Whether closing the view sends `viewClosed` to the app. Defaults to `true`, so views that do not set it keep notifying. |

## Size limits

Checked by `validateLayoutBlocks` (see [interactions.md](interactions.md#validation)), never by the renderers.

| What | Limit |
| --- | --- |
| Blocks in a message | 50 |
| Blocks in a view | 100 |
| Elements in an `actions` block | 25 |
| Options in a select (`options`) | 100 |
| `header` text | 150 characters |
| `section` text | 3000 characters |
| `section` field | 2000 characters |
| `button` text | 75 characters |
| Option text | 75 characters |
| `placeholder` | 150 characters |
| Input `label` and `hint` | 2000 characters |

The limits live in `packages/ui-kit/src/blocks/blockLimits.ts`.
