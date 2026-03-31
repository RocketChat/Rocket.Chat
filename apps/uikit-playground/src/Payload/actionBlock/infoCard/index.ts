import type { LayoutBlock, IconElement, IconButtonElement } from '@rocket.chat/ui-kit';

const getIconButtonPayload = (icon: Partial<IconElement>, label?: string): IconButtonElement => ({
	appId: 'dummy-app-id',
	blockId: 'dummy-block-id',
	actionId: 'dummy-action-id',
	type: 'icon_button',
	icon: { type: 'icon', icon: 'info', variant: 'default', ...icon },
	label: label ?? 'Call history',
});


export const infoCardPlain: readonly LayoutBlock[] = [
    {
		type: 'info_card',
		rows: [
			{
				background: 'default',
				elements: [
					{ type: 'icon', icon: 'phone-issue', variant: 'danger' },
					{ type: 'plain_text', text: 'Call failed' },
				],
				action: getIconButtonPayload({ icon: 'info' }),
			},
		],
	},
];

export const infoCardMultipleRows: readonly LayoutBlock[] = [
    {
		type: 'info_card',
		rows: [
			{
				background: 'default',
				elements: [
					{ type: 'icon', icon: 'phone-off', variant: 'default' },
					{ type: 'plain_text', text: 'Call ended' },
				],
				action: getIconButtonPayload({ icon: 'info' }),
			},
			{
				background: 'secondary',
				elements: [{ type: 'plain_text', text: '00:58' }],
			},
		],
	},
];


