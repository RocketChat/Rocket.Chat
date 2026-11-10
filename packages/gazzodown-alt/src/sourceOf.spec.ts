import type * as MessageParser from '@rocket.chat/message-parser';

import { sourceOf } from './sourceOf';

const plain = (value: string): MessageParser.Plain => ({ type: 'PLAIN_TEXT', value });

const link = (src: string, label: MessageParser.Markup | MessageParser.Markup[]): MessageParser.Link => ({
	type: 'LINK',
	value: { src: plain(src), label },
});

describe('inline markup', () => {
	it('returns the text of a plain node', () => {
		expect(sourceOf(plain('hello'), '')).toBe('hello');
	});

	it.each([
		['bold', { type: 'BOLD', value: [plain('x')] } as MessageParser.Bold, '*x*'],
		['italic', { type: 'ITALIC', value: [plain('x')] } as MessageParser.Italic, '_x_'],
		['strike', { type: 'STRIKE', value: [plain('x')] } as MessageParser.Strike, '~x~'],
		['spoiler', { type: 'SPOILER', value: [plain('x')] } as MessageParser.Spoiler, '||x||'],
		['inline code', { type: 'INLINE_CODE', value: plain('x') } as MessageParser.InlineCode, '`x`'],
		['user mention', { type: 'MENTION_USER', value: plain('rocket.cat') } as MessageParser.UserMention, '@rocket.cat'],
		['channel mention', { type: 'MENTION_CHANNEL', value: plain('general') } as MessageParser.ChannelMention, '#general'],
	])('restores the delimiters of a %s node', (_label, node, expected) => {
		expect(sourceOf(node, '')).toBe(expected);
	});

	it('restores nested markup from the inside out', () => {
		const node: MessageParser.Bold = {
			type: 'BOLD',
			value: [plain('a '), { type: 'ITALIC', value: [plain('b')] }, plain(' '), { type: 'MENTION_USER', value: plain('cat') }],
		};

		expect(sourceOf(node, '')).toBe('*a _b_ @cat*');
	});
});

describe('emoji', () => {
	it('restores a unicode emoji as the glyph itself', () => {
		expect(sourceOf({ type: 'EMOJI', value: undefined, unicode: '😄' }, '')).toBe('😄');
	});

	it('restores a shortcode emoji as a shortcode', () => {
		expect(sourceOf({ type: 'EMOJI', value: plain('smile'), shortCode: 'smile' }, '')).toBe(':smile:');
	});

	it('restores an emoticon as the characters the user typed', () => {
		expect(sourceOf({ type: 'EMOJI', value: plain(':)'), shortCode: 'slight_smile' }, '')).toBe(':)');
	});

	it('falls back to the shortcode when stored data carries no literal', () => {
		const node = { type: 'EMOJI', shortCode: 'smile' } as unknown as MessageParser.Emoji;

		expect(sourceOf(node, '')).toBe(':smile:');
	});

	it('restores a big emoji block by concatenating its emoji', () => {
		const node: MessageParser.BigEmoji = {
			type: 'BIG_EMOJI',
			value: [
				{ type: 'EMOJI', value: plain('smile'), shortCode: 'smile' },
				{ type: 'EMOJI', value: undefined, unicode: '😄' },
			],
		};

		expect(sourceOf(node, '')).toBe(':smile:😄');
	});
});

describe('links', () => {
	it.each([
		['an autolinked URL', link('https://rocket.chat', plain('https://rocket.chat')), 'https://rocket.chat'],
		['a schemeless autolinked URL', link('//rocket.chat/docs', plain('rocket.chat/docs')), 'rocket.chat/docs'],
		['an autolinked email', link('mailto:me@rocket.chat', plain('me@rocket.chat')), 'me@rocket.chat'],
	])('keeps only the typed text of %s', (_label, node, expected) => {
		expect(sourceOf(node, '')).toBe(expected);
	});

	it('restores the bracket form of a markdown link', () => {
		expect(sourceOf(link('https://rocket.chat/docs', plain('the docs')), '')).toBe('[the docs](https://rocket.chat/docs)');
	});

	it('restores a label made of several nodes', () => {
		const node = link('https://rocket.chat', [plain('see '), { type: 'BOLD', value: [plain('docs')] }]);

		expect(sourceOf(node, '')).toBe('[see *docs*](https://rocket.chat)');
	});
});

describe('images', () => {
	it('restores the bracket form of an image', () => {
		const node: MessageParser.Image = {
			type: 'IMAGE',
			value: { src: plain('https://rocket.chat/a.png'), label: plain('alt') },
		};

		expect(sourceOf(node, '')).toBe('![alt](https://rocket.chat/a.png)');
	});

	it('leaves the label empty when it only repeats the source', () => {
		const node: MessageParser.Image = {
			type: 'IMAGE',
			value: { src: plain('https://rocket.chat/a.png'), label: plain('https://rocket.chat/a.png') },
		};

		expect(sourceOf(node, '')).toBe('![](https://rocket.chat/a.png)');
	});
});

describe('nodes that carry a fallback', () => {
	const source = 'at <t:1700000000:t> ok';

	it('slices the source for an offset-range fallback', () => {
		const node: MessageParser.Timestamp = {
			type: 'TIMESTAMP',
			value: { timestamp: '1700000000', format: 't' },
			fallback: [3, 19],
		};

		expect(sourceOf(node, source)).toBe('<t:1700000000:t>');
	});

	it('uses the stored text for a legacy plain fallback', () => {
		const node: MessageParser.Timestamp = {
			type: 'TIMESTAMP',
			value: { timestamp: '1700000000', format: 't' },
			fallback: plain('<t:1700000000:t>'),
		};

		expect(sourceOf(node, '')).toBe('<t:1700000000:t>');
	});

	it.each([
		['a timestamp', { type: 'TIMESTAMP', value: { timestamp: '1700000000', format: 't' } } as MessageParser.Timestamp],
		['a horizontal rule', { type: 'HORIZONTAL_RULE', value: undefined } as MessageParser.HorizontalRule],
		['a table', { type: 'TABLE', value: { header: [], rows: [] } } as MessageParser.Table],
	])('returns nothing for %s with no fallback, leaving the caller to guard the text', (_label, node) => {
		expect(sourceOf(node, source)).toBe('');
	});

	it('slices the source for a horizontal rule', () => {
		expect(sourceOf({ type: 'HORIZONTAL_RULE', value: undefined, fallback: [0, 3] }, '---\nafter')).toBe('---');
	});

	it('slices the source for a table', () => {
		const table = '|a|b|\n|-|-|\n|1|2|';
		const node: MessageParser.Table = { type: 'TABLE', value: { header: [], rows: [] }, fallback: [0, table.length] };

		expect(sourceOf(node, table)).toBe(table);
	});
});

describe('nodes with no source form', () => {
	it.each([
		['a color', { type: 'COLOR', value: { r: 255, g: 0, b: 0, a: 1 } } as MessageParser.Color],
		['inline katex', { type: 'INLINE_KATEX', value: 'x^2' } as MessageParser.InlineKaTeX],
	])('returns nothing for %s', (_label, node) => {
		expect(sourceOf(node, 'irrelevant')).toBe('');
	});
});
