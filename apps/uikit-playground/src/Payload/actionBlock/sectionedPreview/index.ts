import type { LayoutBlock, IconElement, IconButtonElement } from '@rocket.chat/ui-kit';

const getIconButtonPayload = (icon: Partial<IconElement>, label?: string): IconButtonElement => ({
	appId: 'dummy-app-id',
	blockId: 'dummy-block-id',
	actionId: 'dummy-action-id',
	type: 'icon_button',
	icon: { type: 'icon', icon: 'info', variant: 'default', ...icon },
	label: label ?? 'Call history',
});


export const sectionedPreviewPlain: readonly LayoutBlock[] = [
    {
		type: 'sectioned_preview',
		sections: [
			{
				variant: 'foreground',
				accessory: { type: 'icon', icon: 'phone-off', variant: 'default' },
				title: { type: 'plain_text', text: 'Call ended' },
				action: getIconButtonPayload({ icon: 'info' }),
			},
			{
				variant: 'background',
				title: { type: 'plain_text', text: '00:58' },
			},
		],
	},
];

export const sectionedPreviewMultipleSections: readonly LayoutBlock[] = [
    {
		type: 'sectioned_preview',
		sections: [
			{
				variant: 'foreground',
				accessory: { type: 'icon', icon: 'phone-off', variant: 'default' },
				title: { type: 'plain_text', text: 'Call ended' },
				action: getIconButtonPayload({ icon: 'info' }),
			},
			{
				variant: 'background',
				title: { type: 'plain_text', text: '00:58' },
			},
		],
	},
];


