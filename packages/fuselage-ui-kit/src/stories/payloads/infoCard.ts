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
] as const;

export const infoCardMultiple: readonly UiKit.InfoCardBlock[] = [
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
] as const;
