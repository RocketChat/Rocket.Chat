import type * as UiKit from '@rocket.chat/ui-kit';

import { richTextFromMarkdown } from './richTextFromMarkdown';
import { richTextToRuns } from './richTextRuns';
import { richTextToAst } from './richTextToAst';
import { richTextToMarkdown } from './richTextToMarkdown';

const names = {
	users: { u1: 'jane.roe' },
	channels: { c1: 'general' },
	teams: { t1: 'support' },
	messageLinks: { m1: 'https://chat.example/channel/general?msg=m1' },
	messageLabel: 'message',
};

const text = (value: string, style?: UiKit.RichTextStyle): UiKit.RichTextInlineElement => ({
	type: 'text',
	text: value,
	...(style && { style }),
});

describe('richTextToAst', () => {
	it('maps a section with styles, links, emoji, mentions and dates', () => {
		const ast = richTextToAst(
			{
				elements: [
					{
						type: 'rich_text_section',
						elements: [
							text('a', { bold: true }),
							text('b', { italic: true, strike: true }),
							text('c', { code: true }),
							{ type: 'link', url: 'https://example.com', text: 'site' },
							{ type: 'emoji', name: 'tada' },
							{ type: 'user', user_id: 'u1' },
							{ type: 'channel', channel_id: 'c1' },
							{ type: 'broadcast', range: 'channel' },
							{ type: 'date', timestamp: 100, format: 'D' },
						],
					},
				],
			},
			names,
		);

		expect(ast).toEqual([
			{
				type: 'PARAGRAPH',
				value: [
					{ type: 'BOLD', value: [{ type: 'PLAIN_TEXT', value: 'a' }] },
					{ type: 'ITALIC', value: [{ type: 'STRIKE', value: [{ type: 'PLAIN_TEXT', value: 'b' }] }] },
					{ type: 'INLINE_CODE', value: { type: 'PLAIN_TEXT', value: 'c' } },
					{
						type: 'LINK',
						value: { src: { type: 'PLAIN_TEXT', value: 'https://example.com' }, label: { type: 'PLAIN_TEXT', value: 'site' } },
					},
					{ type: 'EMOJI', value: { type: 'PLAIN_TEXT', value: 'tada' }, shortCode: 'tada' },
					{ type: 'MENTION_USER', value: { type: 'PLAIN_TEXT', value: 'jane.roe' } },
					{ type: 'MENTION_CHANNEL', value: { type: 'PLAIN_TEXT', value: 'general' } },
					{ type: 'MENTION_USER', value: { type: 'PLAIN_TEXT', value: 'all' } },
					{ type: 'TIMESTAMP', value: { timestamp: '100', format: 'D' } },
				],
			},
		]);
	});

	it('falls back to the id while a name is unresolved', () => {
		const [paragraph] = richTextToAst(
			{ elements: [{ type: 'rich_text_section', elements: [{ type: 'user', user_id: 'u9' }] }] },
			{ ...names, users: {}, channels: {} },
		);

		expect(paragraph).toEqual({ type: 'PARAGRAPH', value: [{ type: 'MENTION_USER', value: { type: 'PLAIN_TEXT', value: 'u9' } }] });
	});

	it('flattens lists regardless of indent and numbers ordered items', () => {
		const items: UiKit.RichTextSection[] = [
			{ type: 'rich_text_section', elements: [text('one')] },
			{ type: 'rich_text_section', elements: [text('two')] },
		];

		expect(
			richTextToAst(
				{
					elements: [
						{ type: 'rich_text_list', style: 'ordered', indent: 2, elements: items },
						{ type: 'rich_text_list', style: 'bullet', elements: items },
					],
				},
				names,
			),
		).toEqual([
			{
				type: 'ORDERED_LIST',
				value: [
					{ type: 'LIST_ITEM', value: [{ type: 'PLAIN_TEXT', value: 'one' }], number: 1 },
					{ type: 'LIST_ITEM', value: [{ type: 'PLAIN_TEXT', value: 'two' }], number: 2 },
				],
			},
			{
				type: 'UNORDERED_LIST',
				value: [
					{ type: 'LIST_ITEM', value: [{ type: 'PLAIN_TEXT', value: 'one' }] },
					{ type: 'LIST_ITEM', value: [{ type: 'PLAIN_TEXT', value: 'two' }] },
				],
			},
		]);
	});

	it('maps quotes and preformatted text', () => {
		expect(
			richTextToAst(
				{
					elements: [
						{ type: 'rich_text_quote', elements: [text('quoted')] },
						{ type: 'rich_text_preformatted', elements: [text('a\nb')] },
					],
				},
				names,
			),
		).toEqual([
			{ type: 'QUOTE', value: [{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: 'quoted' }] }] },
			{
				type: 'CODE',
				language: undefined,
				value: [
					{ type: 'CODE_LINE', value: { type: 'PLAIN_TEXT', value: 'a' } },
					{ type: 'CODE_LINE', value: { type: 'PLAIN_TEXT', value: 'b' } },
				],
			},
		]);
	});
});

describe('richTextToAst with color, tag, citation and mention elements', () => {
	const plain = (value: string) => ({ type: 'PLAIN_TEXT', value });
	const link = (src: string, label: string) => ({ type: 'LINK', value: { src: plain(src), label: plain(label) } });
	const inlines = (...elements: UiKit.RichTextInlineElement[]) =>
		richTextToAst({ elements: [{ type: 'rich_text_section', elements }] }, names)[0];

	it('maps colors to COLOR tokens and keeps an invalid value as text', () => {
		expect(inlines({ type: 'color', value: '#F405B3' })).toEqual({
			type: 'PARAGRAPH',
			value: [{ type: 'COLOR', value: { r: 244, g: 5, b: 179, a: 255 } }],
		});
		expect(inlines({ type: 'color', value: '#00000080' })).toMatchObject({ value: [{ type: 'COLOR', value: { a: 128 } }] });
		expect(inlines({ type: 'color', value: 'red' })).toEqual({ type: 'PARAGRAPH', value: [plain('red')] });
	});

	it('leaves the style of a link element out, as it always was', () => {
		expect(inlines({ type: 'link', url: 'https://example.com', text: 'site', style: { bold: true } })).toEqual({
			type: 'PARAGRAPH',
			value: [link('https://example.com', 'site')],
		});
	});

	it('maps a tag to its text and a citation to a link labelled with its index', () => {
		expect(
			inlines({ type: 'tag', text: 'Open', color: 'red' }, { type: 'citation', url: 'https://example.com', text: 'Source', index: 2 }),
		).toEqual({
			type: 'PARAGRAPH',
			value: [plain('Open'), link('https://example.com', '[2]')],
		});
	});

	it('maps a citation with an unsafe url to plain text', () => {
		expect(inlines({ type: 'citation', url: 'javascript:alert(1)', text: 'Source', index: 2 })).toEqual({
			type: 'PARAGRAPH',
			value: [plain('[2]')],
		});
	});

	it('links a message mention to its url, or to the permalink, or leaves its label as text', () => {
		const mention = { type: 'message_mention', channel_id: 'c1', message_id: 'm1' } as const;

		expect(inlines({ ...mention, url: 'https://example.com/m', text: 'look' })).toEqual({
			type: 'PARAGRAPH',
			value: [link('https://example.com/m', 'look')],
		});
		expect(inlines(mention)).toEqual({ type: 'PARAGRAPH', value: [link('https://chat.example/channel/general?msg=m1', 'message')] });
		expect(inlines({ ...mention, message_id: 'm2', url: 'javascript:x' })).toEqual({ type: 'PARAGRAPH', value: [plain('message')] });
	});

	it('maps an attachment mention to a link labelled with its text or url, and applies its style', () => {
		expect(inlines({ type: 'attachment_mention', url: 'https://example.com/a' })).toEqual({
			type: 'PARAGRAPH',
			value: [link('https://example.com/a', 'https://example.com/a')],
		});
		expect(inlines({ type: 'attachment_mention', url: 'javascript:x', text: 'file' })).toEqual({
			type: 'PARAGRAPH',
			value: [plain('file')],
		});
		expect(inlines({ type: 'attachment_mention', url: 'https://example.com/a', text: 'file', style: { bold: true } })).toEqual({
			type: 'PARAGRAPH',
			value: [{ type: 'BOLD', value: [link('https://example.com/a', 'file')] }],
		});
	});

	it('maps a usergroup to a user mention and a team to a channel mention, by team name', () => {
		expect(inlines({ type: 'usergroup', usergroup_id: 't1' }, { type: 'team', team_id: 't1' }, { type: 'team', team_id: 't9' })).toEqual({
			type: 'PARAGRAPH',
			value: [
				{ type: 'MENTION_USER', value: plain('support') },
				{ type: 'MENTION_CHANNEL', value: plain('support') },
				{ type: 'MENTION_CHANNEL', value: plain('t9') },
			],
		});
	});
});

describe('richTextToRuns', () => {
	it('keeps containers without tags or citations in one markup run and splits the others around them', () => {
		const runs = richTextToRuns(
			{
				elements: [
					{ type: 'rich_text_section', elements: [text('a')] },
					{ type: 'rich_text_quote', elements: [text('b')] },
					{ type: 'rich_text_section', elements: [text('Status '), { type: 'tag', text: 'Open' }, text(' now')] },
					{ type: 'rich_text_section', elements: [text('c')] },
				],
			},
			names,
		);

		expect(runs.map((run) => run.kind)).toEqual(['markup', 'mixed', 'markup']);
		expect(runs[1]).toMatchObject({
			container: 'section',
			lines: [[{ kind: 'markup' }, { kind: 'custom', element: { type: 'tag' } }, { kind: 'markup' }]],
		});
	});

	it('treats a citation with an unsafe url as markup', () => {
		const runs = richTextToRuns(
			{ elements: [{ type: 'rich_text_section', elements: [{ type: 'citation', url: 'javascript:x', text: 's', index: 1 }] }] },
			names,
		);

		expect(runs.map((run) => run.kind)).toEqual(['markup']);
	});
});

describe('richTextToMarkdown with the new elements', () => {
	it('writes them as text a user could have typed', () => {
		expect(
			richTextToMarkdown(
				{
					elements: [
						{
							type: 'rich_text_section',
							elements: [
								{ type: 'color', value: '#FFF000' },
								text(' '),
								{ type: 'tag', text: 'Open', style: { bold: true } },
								text(' '),
								{ type: 'citation', url: 'https://example.com', text: 'Source', index: 1 },
								text(' '),
								{ type: 'message_mention', channel_id: 'c1', message_id: 'm1', text: 'look' },
								text(' '),
								{ type: 'attachment_mention', url: 'https://example.com/a' },
								text(' '),
								{ type: 'usergroup', usergroup_id: 't1' },
								text(' '),
								{ type: 'team', team_id: 't1' },
							],
						},
					],
				},
				names,
			),
		).toBe(
			'#FFF000 **Open** [1](https://example.com) [look](https://chat.example/channel/general?msg=m1) [https://example.com/a](https://example.com/a) @support #support',
		);
	});
});

describe('richTextToMarkdown', () => {
	it('writes every container as the Markdown that produces it', () => {
		expect(
			richTextToMarkdown(
				{
					elements: [
						{
							type: 'rich_text_section',
							elements: [
								text('bold', { bold: true }),
								text(' '),
								{ type: 'user', user_id: 'u1' },
								text(' '),
								{ type: 'link', url: 'https://example.com', text: 'site' },
							],
						},
						{
							type: 'rich_text_list',
							style: 'ordered',
							elements: [
								{ type: 'rich_text_section', elements: [text('one')] },
								{ type: 'rich_text_section', elements: [text('two')] },
							],
						},
						{ type: 'rich_text_quote', elements: [text('quoted')] },
						{ type: 'rich_text_preformatted', elements: [text('code')] },
					],
				},
				names,
			),
		).toBe('**bold** @jane.roe [site](https://example.com)\n\n1. one\n2. two\n\n> quoted\n\n```\ncode\n```');
	});
});

describe('richTextFromMarkdown', () => {
	it('parses styles, links and emoji into inline elements', () => {
		expect(richTextFromMarkdown('**bold** _it_ ~gone~ `code` [site](https://example.com) :tada:')).toEqual({
			type: 'rich_text',
			elements: [
				{
					type: 'rich_text_section',
					elements: [
						text('bold', { bold: true }),
						text(' '),
						text('it', { italic: true }),
						text(' '),
						text('gone', { strike: true }),
						text(' '),
						text('code', { code: true }),
						text(' '),
						{ type: 'link', url: 'https://example.com', text: 'site' },
						text(' '),
						{ type: 'emoji', name: 'tada' },
					],
				},
			],
		});
	});

	it('parses lists, quotes and code blocks', () => {
		const { elements } = richTextFromMarkdown('- a\n- b\n\n1. x\n\n> q\n\n```\nl1\nl2\n```');

		expect(elements).toEqual([
			{
				type: 'rich_text_list',
				style: 'bullet',
				elements: [
					{ type: 'rich_text_section', elements: [text('a')] },
					{ type: 'rich_text_section', elements: [text('b')] },
				],
			},
			{ type: 'rich_text_list', style: 'ordered', elements: [{ type: 'rich_text_section', elements: [text('x')] }] },
			{ type: 'rich_text_quote', elements: [text('q')] },
			{ type: 'rich_text_preformatted', elements: [text('l1\nl2')] },
		]);
	});

	it('emits a nested list after its parent items with its indent', () => {
		const { elements } = richTextFromMarkdown('- a\n  - b\n- c');

		expect(elements).toEqual([
			{ type: 'rich_text_list', style: 'bullet', elements: [{ type: 'rich_text_section', elements: [text('a')] }] },
			{ type: 'rich_text_list', style: 'bullet', indent: 1, elements: [{ type: 'rich_text_section', elements: [text('b')] }] },
			{ type: 'rich_text_list', style: 'bullet', elements: [{ type: 'rich_text_section', elements: [text('c')] }] },
		]);
	});

	it('keeps typed mentions as text and broadcasts as structured elements', () => {
		const [section] = richTextFromMarkdown('@jane.roe #general @here').elements;

		expect(section).toEqual({
			type: 'rich_text_section',
			elements: [text('@jane.roe'), text(' '), text('#general'), text(' '), { type: 'broadcast', range: 'here' }],
		});
	});

	it('round-trips a block written as Markdown', () => {
		const markdown = '**a** and _b_\n\n- one\n- two\n\n> q';

		expect(richTextToMarkdown(richTextFromMarkdown(markdown), names)).toBe(markdown);
	});
});
