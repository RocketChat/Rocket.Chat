import type * as UiKit from '@rocket.chat/ui-kit';

export const contextActions: readonly UiKit.LayoutBlock[] = [
	{
		type: 'section',
		text: { type: 'mrkdwn', text: 'The deploy finished in **4m 12s**.' },
	},
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
] as const;
