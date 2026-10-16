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
