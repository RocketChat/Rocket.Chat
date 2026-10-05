<!-- Snapshot of the code as of October 2026. Update it by hand when you change a block type, a surface union or a renderer. -->

# UiKit reference

Every block, element, text object, composition object and view that `@rocket.chat/ui-kit` defines, with its fields as the types declare them. For where each one is accepted and rendered, see [support-matrix.md](support-matrix.md).

## Layout blocks

### `actions`

Source: [`packages/ui-kit/src/blocks/layout/ActionsBlock.ts`](../../../packages/ui-kit/src/blocks/layout/ActionsBlock.ts)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `'actions'` | yes |  |
| `elements` | `readonly ( \| ButtonElement \| ChannelsSelectElement \| ConversationsSelectElement \| DatePickerElement \| LinearScaleElement \| MultiChannelsSelectElement \| MultiConversationsSelectElement \| MultiStaticSelectElement \| MultiUsersSelectElement \| OverflowElement \| StaticSelectElement \| UsersSelectElement \| ToggleSwitchElement \| CheckboxElement \| RadioButtonElement \| TimePickerElement )[]` | yes |  |
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
| `element` | `\| ChannelsSelectElement \| ConversationsSelectElement \| DatePickerElement \| LinearScaleElement \| MultiChannelsSelectElement \| MultiConversationsSelectElement \| MultiStaticSelectElement \| MultiUsersSelectElement \| PlainTextInputElement \| StaticSelectElement \| UsersSelectElement \| CheckboxElement \| RadioButtonElement \| TimePickerElement \| ToggleSwitchElement` | yes |  |
| `hint` | `PlainText` | no |  |
| `optional` | `boolean` | no |  |
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

### `section`

Source: [`packages/ui-kit/src/blocks/layout/SectionBlock.ts`](../../../packages/ui-kit/src/blocks/layout/SectionBlock.ts)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `'section'` | yes |  |
| `text` | `TextObject` | no |  |
| `fields` | `readonly TextObject[]` | no |  |
| `accessory` | `ButtonElement \| ChannelsSelectElement \| CheckboxElement \| ConversationsSelectElement \| DatePickerElement \| ImageElement \| MultiChannelsSelectElement \| MultiConversationsSelectElement \| MultiStaticSelectElement \| MultiUsersSelectElement \| OverflowElement \| RadioButtonElement \| StaticSelectElement \| TimePickerElement \| UsersSelectElement` | no |  |
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
| `appId` | `string` | yes |  |
| `blockId` | `string` | yes |  |
| `actionId` | `string` | yes |  |
| `confirm` | `ConfirmationDialog` | no |  |
| `dispatchActionConfig` | `InputElementDispatchAction[]` | no |  |

### `checkbox`

Source: [`packages/ui-kit/src/blocks/elements/CheckboxElement.ts`](../../../packages/ui-kit/src/blocks/elements/CheckboxElement.ts)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `'checkbox'` | yes |  |
| `options` | `Option[]` | yes |  |
| `initialOptions` | `Option[]` | no |  |
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
| `focusOnLoad` | `boolean` | no | Focuses the field when the view opens. |
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
| `focusOnLoad` | `boolean` | no | Focuses the field when the view opens. |
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
| `focusOnLoad` | `boolean` | no | Focuses the field when the view opens. |
| `appId` | `string` | yes |  |
| `blockId` | `string` | yes |  |
| `actionId` | `string` | yes |  |
| `confirm` | `ConfirmationDialog` | no |  |
| `dispatchActionConfig` | `InputElementDispatchAction[]` | no |  |

### `icon`

Source: [`packages/ui-kit/src/blocks/elements/IconElement.ts`](../../../packages/ui-kit/src/blocks/elements/IconElement.ts)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `'icon'` | yes |  |
| `icon` | `AvailableIcons` | yes |  |
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
| `focusOnLoad` | `boolean` | no | Focuses the field when the view opens. |
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
| `focusOnLoad` | `boolean` | no | Focuses the field when the view opens. |
| `appId` | `string` | yes |  |
| `blockId` | `string` | yes |  |
| `actionId` | `string` | yes |  |
| `confirm` | `ConfirmationDialog` | no |  |
| `dispatchActionConfig` | `InputElementDispatchAction[]` | no |  |

### `radio_button`

Source: [`packages/ui-kit/src/blocks/elements/RadioButtonElement.ts`](../../../packages/ui-kit/src/blocks/elements/RadioButtonElement.ts)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `'radio_button'` | yes |  |
| `options` | `Option[]` | yes |  |
| `initialOption` | `Option` | no |  |
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
| `type` | `'time_picker'` | yes |  |
| `placeholder` | `TextObject` | no |  |
| `initialTime` | `string` | no |  |
| `focusOnLoad` | `boolean` | no | Focuses the field when the view opens. |
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
| `focusOnLoad` | `boolean` | no | Focuses the field when the view opens. |
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
