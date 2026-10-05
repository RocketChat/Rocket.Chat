import type { LayoutBlock, Option } from '@rocket.chat/ui-kit';

const ids = { appId: 'app-id', blockId: 'block-id', actionId: 'action-id' } as const;

const options: Option[] = [
	{ text: { type: 'plain_text', text: 'Starter' }, value: 'starter' },
	{ text: { type: 'plain_text', text: 'Pro' }, value: 'pro' },
];

export const sectionWithRadioButtons: readonly LayoutBlock[] = [
	{
		type: 'section',
		text: { type: 'mrkdwn', text: 'Which plan should we use?' },
		accessory: { ...ids, type: 'radio_button', options },
	},
];

export const sectionWithCheckbox: readonly LayoutBlock[] = [
	{
		type: 'section',
		text: { type: 'mrkdwn', text: 'Which plans should we offer?' },
		accessory: { ...ids, type: 'checkbox', options },
	},
];

export const sectionWithUsersSelect: readonly LayoutBlock[] = [
	{
		type: 'section',
		text: { type: 'mrkdwn', text: 'Who owns this task?' },
		accessory: { ...ids, type: 'users_select' },
	},
];
