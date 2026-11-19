import type * as UiKit from '@rocket.chat/ui-kit';

export const richText: readonly UiKit.LayoutBlock[] = [
	{
		type: 'rich_text',
		elements: [
			{
				type: 'rich_text_section',
				elements: [
					{ type: 'text', text: 'Release ', style: { bold: true } },
					{ type: 'text', text: '7.0 ', style: { italic: true, strike: true } },
					{ type: 'text', text: 'is out, thanks ' },
					{ type: 'user', user_id: 'rocket.cat' },
					{ type: 'text', text: ' in ' },
					{ type: 'channel', channel_id: 'GENERAL' },
					{ type: 'text', text: '. See the ' },
					{ type: 'link', url: 'https://docs.rocket.chat', text: 'docs' },
					{ type: 'text', text: ' ' },
					{ type: 'emoji', name: 'tada' },
				],
			},
			{
				type: 'rich_text_list',
				style: 'bullet',
				elements: [
					{ type: 'rich_text_section', elements: [{ type: 'text', text: 'Faster search' }] },
					{
						type: 'rich_text_section',
						elements: [
							{ type: 'text', text: 'New ' },
							{ type: 'text', text: 'rich_text', style: { code: true } },
						],
					},
				],
			},
			{
				type: 'rich_text_list',
				style: 'ordered',
				elements: [
					{ type: 'rich_text_section', elements: [{ type: 'text', text: 'Update' }] },
					{ type: 'rich_text_section', elements: [{ type: 'text', text: 'Restart' }] },
				],
			},
			{ type: 'rich_text_quote', elements: [{ type: 'text', text: 'Ship it.' }] },
			{ type: 'rich_text_preformatted', elements: [{ type: 'text', text: 'yarn install\nyarn build' }] },
			{
				type: 'rich_text_section',
				elements: [
					{ type: 'broadcast', range: 'here' },
					{ type: 'text', text: ' starts ' },
					{ type: 'date', timestamp: 1767225600, format: 'f' },
				],
			},
		],
	},
] as const;

export const richTextElements: readonly UiKit.LayoutBlock[] = [
	{
		type: 'rich_text',
		elements: [
			{
				type: 'rich_text_section',
				elements: [
					{ type: 'text', text: 'Status ' },
					{ type: 'tag', text: 'In progress', color: 'blue' },
					{ type: 'text', text: ' ' },
					{ type: 'tag', text: 'Blocked', color: 'red', style: { bold: true } },
					{ type: 'text', text: ' brand color ' },
					{ type: 'color', value: '#F405B3' },
					{ type: 'text', text: ' as cited ' },
					{
						type: 'citation',
						url: 'https://docs.rocket.chat',
						text: 'Rocket.Chat docs',
						index: 1,
						details: { citation_type: 'web', display_name: 'docs.rocket.chat' },
					},
				],
			},
			{
				type: 'rich_text_section',
				elements: [
					{ type: 'text', text: 'Ask ' },
					{ type: 'usergroup', usergroup_id: 'team-id' },
					{ type: 'text', text: ' in ' },
					{ type: 'team', team_id: 'team-id' },
					{ type: 'text', text: ', see ' },
					{ type: 'message_mention', channel_id: 'GENERAL', message_id: 'message-id', text: 'this message' },
					{ type: 'text', text: ' and ' },
					{ type: 'attachment_mention', url: 'https://example.com/report.pdf', text: 'the report' },
				],
			},
		],
	},
] as const;

export const inputWithRichTextInput: readonly UiKit.LayoutBlock[] = [
	{
		type: 'input',
		element: {
			appId: 'dummy-app-id',
			blockId: 'dummy-block-id',
			type: 'rich_text_input',
			actionId: 'input-0',
			placeholder: { type: 'plain_text', text: 'Write Markdown' },
			initial_value: {
				type: 'rich_text',
				elements: [
					{
						type: 'rich_text_section',
						elements: [
							{ type: 'text', text: 'Hello ', style: { bold: true } },
							{ type: 'text', text: 'world' },
						],
					},
					{ type: 'rich_text_list', style: 'bullet', elements: [{ type: 'rich_text_section', elements: [{ type: 'text', text: 'one' }] }] },
				],
			},
		},
		label: { type: 'plain_text', text: 'Description', emoji: true },
	},
] as const;
