import type * as UiKit from '@rocket.chat/ui-kit';

export const markdown: readonly UiKit.LayoutBlock[] = [
	{
		type: 'markdown',
		text: '**Release notes**\n\n- Faster search\n- New `markdown` block\n\nSee the [docs](https://docs.rocket.chat) for details.',
	},
] as const;
