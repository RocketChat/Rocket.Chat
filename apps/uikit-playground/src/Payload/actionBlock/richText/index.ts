import type { LayoutBlock } from '@rocket.chat/ui-kit';

export const richText: readonly LayoutBlock[] = [
	{
		type: 'rich_text',
		elements: [
			{
				type: 'rich_text_section',
				elements: [
					{ type: 'text', text: 'Release ', style: { bold: true } },
					{ type: 'text', text: 'is out, thanks ' },
					{ type: 'user', user_id: 'rocket.cat' },
					{ type: 'text', text: ' ' },
					{ type: 'emoji', name: 'tada' },
				],
			},
			{
				type: 'rich_text_list',
				style: 'bullet',
				elements: [
					{ type: 'rich_text_section', elements: [{ type: 'text', text: 'Faster search' }] },
					{ type: 'rich_text_section', elements: [{ type: 'link', url: 'https://docs.rocket.chat', text: 'Read the docs' }] },
				],
			},
			{ type: 'rich_text_quote', elements: [{ type: 'text', text: 'Ship it.' }] },
			{
				type: 'rich_text_section',
				elements: [
					{ type: 'tag', text: 'In progress', color: 'blue' },
					{ type: 'text', text: ' ' },
					{ type: 'color', value: '#F405B3' },
					{ type: 'text', text: ' ' },
					{ type: 'citation', url: 'https://docs.rocket.chat', text: 'Rocket.Chat docs', index: 1 },
				],
			},
		],
	},
];

export const inputWithRichTextInput: readonly LayoutBlock[] = [
	{
		type: 'input',
		element: {
			appId: 'app-id',
			blockId: 'block-id',
			actionId: 'action-id',
			type: 'rich_text_input',
			placeholder: { type: 'plain_text', text: 'Write Markdown' },
		},
		label: { type: 'plain_text', text: 'Description' },
	},
];
