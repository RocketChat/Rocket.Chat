import type * as UiKit from '@rocket.chat/ui-kit';

export const inputWithMultilinePlainTextInput: readonly UiKit.LayoutBlock[] = [
	{
		type: 'input',
		element: {
			appId: 'dummy-app-id',
			blockId: 'dummy-block-id',
			type: 'plain_text_input',
			multiline: true,
			actionId: 'input-0',
		},
		label: {
			type: 'plain_text',
			text: 'Label',
			emoji: true,
		},
	},
] as const;

export const inputWithPlainTextInput: readonly UiKit.LayoutBlock[] = [
	{
		type: 'input',
		element: {
			appId: 'dummy-app-id',
			blockId: 'dummy-block-id',
			type: 'plain_text_input',
			actionId: 'input-0',
		},
		label: {
			type: 'plain_text',
			text: 'Label',
			emoji: true,
		},
	},
] as const;

export const inputWithNumberInput: readonly UiKit.LayoutBlock[] = [
	{
		type: 'input',
		element: {
			appId: 'dummy-app-id',
			blockId: 'dummy-block-id',
			type: 'number_input',
			is_decimal_allowed: false,
			min_value: '1',
			max_value: '10',
			actionId: 'input-0',
		},
		label: {
			type: 'plain_text',
			text: 'Seats',
		},
	},
] as const;

export const inputWithEmailTextInput: readonly UiKit.LayoutBlock[] = [
	{
		type: 'input',
		element: {
			appId: 'dummy-app-id',
			blockId: 'dummy-block-id',
			type: 'email_text_input',
			placeholder: { type: 'plain_text', text: 'name@example.com' },
			actionId: 'input-0',
		},
		label: {
			type: 'plain_text',
			text: 'Email',
		},
	},
] as const;

export const inputWithUrlTextInput: readonly UiKit.LayoutBlock[] = [
	{
		type: 'input',
		element: {
			appId: 'dummy-app-id',
			blockId: 'dummy-block-id',
			type: 'url_text_input',
			placeholder: { type: 'plain_text', text: 'https://' },
			actionId: 'input-0',
		},
		label: {
			type: 'plain_text',
			text: 'Website',
		},
	},
] as const;

export const inputWithMultiUsersSelect: readonly UiKit.LayoutBlock[] = [
	{
		type: 'input',
		element: {
			appId: 'dummy-app-id',
			blockId: 'dummy-block-id',
			type: 'multi_users_select',
			// placeholder: {
			//   type: 'plain_text',
			//   text: 'Select users',
			//   emoji: true,
			// },
			actionId: 'input-0',
		},
		label: {
			type: 'plain_text',
			text: 'Label',
			emoji: true,
		},
	},
] as const;

export const inputWithConversationsSelect: readonly UiKit.LayoutBlock[] = [
	{
		type: 'input',
		element: {
			appId: 'dummy-app-id',
			blockId: 'dummy-block-id',
			type: 'conversations_select',
			actionId: 'input-0',
		},
		label: {
			type: 'plain_text',
			text: 'Label',
			emoji: true,
		},
	},
] as const;

export const inputWithMultiConversationsSelect: readonly UiKit.LayoutBlock[] = [
	{
		type: 'input',
		element: {
			appId: 'dummy-app-id',
			blockId: 'dummy-block-id',
			type: 'multi_conversations_select',
			actionId: 'input-0',
		},
		label: {
			type: 'plain_text',
			text: 'Label',
			emoji: true,
		},
	},
] as const;

export const inputWithStaticSelect: readonly UiKit.LayoutBlock[] = [
	{
		type: 'input',
		element: {
			appId: 'dummy-app-id',
			blockId: 'dummy-block-id',
			type: 'static_select',
			placeholder: {
				type: 'plain_text',
				text: 'Select an item',
				emoji: true,
			},
			options: [
				{
					text: {
						type: 'plain_text',
						text: '*this is plain_text text*',
						emoji: true,
					},
					value: 'value-0',
				},
				{
					text: {
						type: 'plain_text',
						text: '*this is plain_text text*',
						emoji: true,
					},
					value: 'value-1',
				},
				{
					text: {
						type: 'plain_text',
						text: '*this is plain_text text*',
						emoji: true,
					},
					value: 'value-2',
				},
			],
			actionId: 'input-0',
		},
		label: {
			type: 'plain_text',
			text: 'Label',
			emoji: true,
		},
	},
] as const;

export const inputWithDatePicker: readonly UiKit.LayoutBlock[] = [
	{
		type: 'input',
		element: {
			appId: 'dummy-app-id',
			blockId: 'dummy-block-id',
			type: 'datepicker',
			initialDate: '1990-04-28',
			placeholder: {
				type: 'plain_text',
				text: 'Select a date',
				emoji: true,
			},
			actionId: 'input-0',
		},
		label: {
			type: 'plain_text',
			text: 'Label',
			emoji: true,
		},
	},
] as const;

export const inputWithDateTimePicker: readonly UiKit.LayoutBlock[] = [
	{
		type: 'input',
		element: {
			appId: 'dummy-app-id',
			blockId: 'dummy-block-id',
			type: 'datetimepicker',
			initial_date_time: 1791216000,
			actionId: 'input-0',
		},
		label: {
			type: 'plain_text',
			text: 'Meeting time',
		},
	},
] as const;

export const inputWithLinearScale: readonly UiKit.LayoutBlock[] = [
	{
		type: 'input',
		element: {
			appId: 'dummy-app-id',
			blockId: 'dummy-block-id',
			type: 'linear_scale',
			minValue: 0,
			maxValue: 10,
			initialValue: 7,
			actionId: 'input-0',
		},
		label: {
			type: 'plain_text',
			text: 'Label',
			emoji: true,
		},
	},
] as const;

export const inputWithExternalSelect: readonly UiKit.LayoutBlock[] = [
	{
		type: 'input',
		element: {
			appId: 'dummy-app-id',
			blockId: 'dummy-block-id',
			type: 'external_select',
			actionId: 'input-0',
			placeholder: { type: 'plain_text', text: 'Type at least 3 characters' },
			initial_option: { text: { type: 'plain_text', text: 'Rocket.Chat' }, value: 'rocketchat' },
		},
		label: { type: 'plain_text', text: 'Project', emoji: true },
	},
] as const;

export const inputWithMultiExternalSelect: readonly UiKit.LayoutBlock[] = [
	{
		type: 'input',
		element: {
			appId: 'dummy-app-id',
			blockId: 'dummy-block-id',
			type: 'multi_external_select',
			actionId: 'input-0',
			placeholder: { type: 'plain_text', text: 'Type at least 3 characters' },
			min_query_length: 2,
			max_selected_items: 3,
		},
		label: { type: 'plain_text', text: 'Projects', emoji: true },
	},
] as const;
