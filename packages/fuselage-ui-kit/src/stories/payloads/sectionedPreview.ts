import type * as UiKit from '@rocket.chat/ui-kit';

const getIconButtonPayload = (icon: Partial<UiKit.IconElement>, label?: string): UiKit.IconButtonElement => ({
	appId: 'dummy-app-id',
	blockId: 'dummy-block-id',
	actionId: 'dummy-action-id',
	type: 'icon_button',
	icon: { type: 'icon', icon: 'info', variant: 'default', ...icon },
	label: label ?? 'Call history',
});

export const sectionedPreview: readonly UiKit.SectionedPreviewBlock[] = [
	{
		type: 'sectioned_preview',
		sections: [
			{
				variant: 'foreground',
				accessory: { type: 'icon', icon: 'phone-issue', variant: 'danger' },
				title: { type: 'plain_text', text: 'Voice call failed' },
				action: getIconButtonPayload({ icon: 'info' }),
			},
		],
	},
] as const;

export const sectionedPreviewMultiple: readonly UiKit.SectionedPreviewBlock[] = [
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
] as const;
