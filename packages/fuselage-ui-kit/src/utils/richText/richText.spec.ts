import type * as UiKit from '@rocket.chat/ui-kit';

import { richTextFromMarkdown } from './richTextFromMarkdown';
import { richTextToAst } from './richTextToAst';
import { richTextToMarkdown } from './richTextToMarkdown';

const names = { users: { u1: 'jane.roe' }, channels: { c1: 'general' } };

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
			{ users: {}, channels: {} },
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
