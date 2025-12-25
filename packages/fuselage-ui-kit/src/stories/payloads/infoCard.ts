import type * as UiKit from '@rocket.chat/ui-kit';

const getIconButtonPayload = (icon: Partial<UiKit.IconElement>, label?: string): UiKit.IconButtonElement => ({
	appId: 'dummy-app-id',
	blockId: 'dummy-block-id',
	actionId: 'dummy-action-id',
	type: 'icon_button',
	icon: { type: 'icon', icon: 'info', variant: 'default', ...icon },
	label: label ?? 'Call history',
});

export const infoCard: readonly UiKit.InfoCardBlock[] = [
	{
		type: 'info_card',
		rows: [
			{
				background: 'default',
				elements: [
					{ type: 'icon', icon: 'phone-issue', variant: 'danger' },
					{ type: 'plain_text', text: 'Voice call failed' },
				],
				action: getIconButtonPayload({ icon: 'info' }),
			},
		],
	},
];

export const infoCardMultiple: readonly UiKit.InfoCardBlock[] = [
	{
		type: 'info_card',
		rows: [
			{
				background: 'default',
				elements: [
					{ type: 'icon', icon: 'phone-off', variant: 'warning' },
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

export const infoCardMultipleIcons: readonly UiKit.InfoCardBlock[] = [
	{
		type: 'info_card',
		rows: [
			{
				background: 'default',
				elements: [
					{ type: 'plain_text', text: 'Framed icons' },
					{ type: 'icon', icon: 'phone-off', variant: 'default', framed: true },
					{ type: 'icon', icon: 'clock', variant: 'warning', framed: true },
					{ type: 'icon', icon: 'phone-question-mark', variant: 'warning', framed: true },
					{ type: 'icon', icon: 'phone-issue', variant: 'danger', framed: true },
				],
			},
			{
				background: 'secondary',
				elements: [
					{ type: 'plain_text', text: 'Icons' },
					{ type: 'icon', icon: 'phone-off', variant: 'default' },
					{ type: 'icon', icon: 'clock', variant: 'warning' },
					{ type: 'icon', icon: 'phone-question-mark', variant: 'warning' },
					{ type: 'icon', icon: 'phone-issue', variant: 'danger' },
					{ type: 'icon', icon: 'info', variant: 'secondary' },
				],
			},
		],
	},
];
