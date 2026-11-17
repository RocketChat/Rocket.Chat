import type { LayoutBlock } from '@rocket.chat/ui-kit';

export const contextActions: readonly LayoutBlock[] = [
	{
		type: 'context_actions',
		elements: [
			{
				type: 'icon_button',
				appId: 'app-id',
				blockId: 'block-id',
				actionId: 'details',
				icon: { type: 'icon', icon: 'info', variant: 'default' },
				label: 'Show details',
				value: 'details',
			},
			{
				type: 'icon_button',
				appId: 'app-id',
				blockId: 'block-id',
				actionId: 'open-run',
				icon: { type: 'icon', icon: 'arrow-forward', variant: 'default' },
				label: 'Open the run',
				url: 'https://rocket.chat',
			},
		],
	},
];

export const contextActionsWithFeedback: readonly LayoutBlock[] = [
	{
		type: 'context_actions',
		elements: [
			{
				type: 'feedback_buttons',
				appId: 'app-id',
				blockId: 'block-id',
				actionId: 'rate-answer',
				positive_button: { text: { type: 'plain_text', text: 'Good answer' }, value: 'good' },
				negative_button: { text: { type: 'plain_text', text: 'Bad answer' }, value: 'bad' },
			},
		],
	},
];
