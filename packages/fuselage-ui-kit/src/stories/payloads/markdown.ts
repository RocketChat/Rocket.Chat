import type * as UiKit from '@rocket.chat/ui-kit';

export const markdown: readonly UiKit.LayoutBlock[] = [
	{
		type: 'markdown',
		text: '# Heading\n\nThis is a **markdown** block with _emphasis_, `code` and a [link](https://rocket.chat).\n\n- item one\n- item two',
	},
] as const;
