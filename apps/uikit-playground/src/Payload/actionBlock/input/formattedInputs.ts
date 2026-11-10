import type { LayoutBlock } from '@rocket.chat/ui-kit';

const ids = { appId: 'app-id', blockId: 'block-id', actionId: 'action-id' } as const;

export const inputWithNumberInput: readonly LayoutBlock[] = [
	{
		type: 'input',
		element: { ...ids, type: 'number_input', is_decimal_allowed: false, min_value: '1', max_value: '10', initial_value: '3' },
		label: { type: 'plain_text', text: 'Seats' },
	},
];

export const inputWithEmailInput: readonly LayoutBlock[] = [
	{
		type: 'input',
		element: { ...ids, type: 'email_text_input', placeholder: { type: 'plain_text', text: 'name@example.com' } },
		label: { type: 'plain_text', text: 'Email' },
	},
];

export const inputWithUrlInput: readonly LayoutBlock[] = [
	{
		type: 'input',
		element: { ...ids, type: 'url_text_input', placeholder: { type: 'plain_text', text: 'https://' } },
		label: { type: 'plain_text', text: 'Website' },
	},
];

export const inputWithDateTimePicker: readonly LayoutBlock[] = [
	{
		type: 'input',
		element: { ...ids, type: 'datetimepicker', initial_date_time: 1791216000 },
		label: { type: 'plain_text', text: 'Meeting time' },
	},
];

export const inputWithConversationsSelect: readonly LayoutBlock[] = [
	{
		type: 'input',
		element: { ...ids, type: 'conversations_select', initial_conversation: 'GENERAL' },
		label: { type: 'plain_text', text: 'Conversation' },
	},
];

export const inputWithMultiConversationsSelect: readonly LayoutBlock[] = [
	{
		type: 'input',
		element: { ...ids, type: 'multi_conversations_select', initial_conversations: ['GENERAL', 'd1'] },
		label: { type: 'plain_text', text: 'Conversations' },
	},
];
