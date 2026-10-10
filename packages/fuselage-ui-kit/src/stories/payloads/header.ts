import type * as UiKit from '@rocket.chat/ui-kit';

export const header: readonly UiKit.LayoutBlock[] = [
	{
		type: 'header',
		text: {
			type: 'plain_text',
			text: 'Budget performance',
		},
	},
	{
		type: 'section',
		text: {
			type: 'mrkdwn',
			text: 'Spending is *12%* under plan this quarter.',
		},
	},
] as const;
