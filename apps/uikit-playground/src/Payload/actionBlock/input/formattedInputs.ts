import type { LayoutBlock } from '@rocket.chat/ui-kit';

const ids = { appId: 'app-id', blockId: 'block-id', actionId: 'action-id' } as const;

export const inputWithNumberInput: readonly LayoutBlock[] = [
	{
		type: 'input',
		element: { ...ids, type: 'number_input', isDecimalAllowed: false, minValue: '1', maxValue: '10', initialValue: '3' },
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
		element: { ...ids, type: 'datetimepicker', initialDateTime: 1791216000 },
		label: { type: 'plain_text', text: 'Meeting time' },
	},
];

export const inputWithConversationsSelect: readonly LayoutBlock[] = [
	{
		type: 'input',
		element: { ...ids, type: 'conversations_select' },
		label: { type: 'plain_text', text: 'Conversation' },
	},
];

export const inputWithMultiConversationsSelect: readonly LayoutBlock[] = [
	{
		type: 'input',
		element: { ...ids, type: 'multi_conversations_select' },
		label: { type: 'plain_text', text: 'Conversations' },
	},
];
