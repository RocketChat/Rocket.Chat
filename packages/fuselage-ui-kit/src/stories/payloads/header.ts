import type * as UiKit from '@rocket.chat/ui-kit';

export const header: readonly UiKit.LayoutBlock[] = [
	{
		type: 'header',
		text: {
			type: 'plain_text',
			text: 'This is a header block',
		},
	},
] as const;
