import type * as MessageParser from '@rocket.chat/message-parser';
import fc from 'fast-check';

import { anchorsOf, mountBareTokens, mountSource, mountTokens, textOf } from './testUtils';

const plain = (value: string): MessageParser.Plain => ({ type: 'PLAIN_TEXT', value });

const paragraph = (value: string): MessageParser.Paragraph => ({ type: 'PARAGRAPH', value: [plain(value)] });

const textOfTokens = (tokens: MessageParser.Root, source = ''): string => mountTokens(tokens, source).textContent ?? '';

const styledNodes = (input: HTMLElement): Element[] => Array.from(input.querySelectorAll('[style], [class]'));

const code = (language: string | undefined, ...lines: string[]): MessageParser.Root => [
	{
		type: 'CODE',
		language,
		value: lines.map((line) => ({ type: 'CODE_LINE', value: plain(line) })),
	},
];

const listItems = (...values: string[]): MessageParser.ListItem[] =>
	values.map((value, index) => ({ type: 'LIST_ITEM', value: [plain(value)], number: index + 1 }));

const tasks: MessageParser.Tasks = {
	type: 'TASKS',
	value: [
		{ type: 'TASK', status: true, value: [plain('done')] },
		{ type: 'TASK', status: false, value: [plain('todo')] },
	],
};

const bigEmoji: MessageParser.BigEmoji = {
	type: 'BIG_EMOJI',
	value: [
		{ type: 'EMOJI', value: plain('smile'), shortCode: 'smile' },
		{ type: 'EMOJI', value: undefined, unicode: '😄' },
	],
};

const TABLE_SOURCE = '|a|b|\n|-|-|\n|1|2|';

const horizontalRule: MessageParser.HorizontalRule = { type: 'HORIZONTAL_RULE', value: undefined, fallback: [0, 3] };

const table: MessageParser.Table = { type: 'TABLE', value: { header: [], rows: [] }, fallback: [0, TABLE_SOURCE.length] };

describe('block structure', () => {
	it('closes a paragraph with a line ending', () => {
		expect(textOfTokens([paragraph('hello')])).toBe('hello\n');
	});

	it('renders a line break as a bare line ending', () => {
		expect(textOfTokens([{ type: 'LINE_BREAK', value: undefined }])).toBe('\n');
	});
});

describe('blocks the composer gives visual treatment', () => {
	it.each([
		[1, '1.5em'],
		[2, '1.3em'],
		[3, '1.1em'],
		[4, '1em'],
	])('sizes a level %s heading and keeps its hashes', (level, fontSize) => {
		const tokens: MessageParser.Root = [{ type: 'HEADING', level: level as 1 | 2 | 3 | 4, value: [plain('Title')] }];
		const input = mountTokens(tokens);

		expect(input.textContent).toBe(`${'#'.repeat(level)} Title\n`);
		expect(input.querySelector('span')?.getAttribute('style')).toBe(`font-weight:bold;font-size:${fontSize}`);
	});

	it('rules a quote and marks every one of its lines', () => {
		const input = mountTokens([{ type: 'QUOTE', value: [paragraph('first'), paragraph('second')] }]);

		expect(input.textContent).toBe('> first\n> second\n');
		expect(input.querySelector('span')?.getAttribute('style')).toBe(
			'border-inline-start:2px solid var(--rcx-color-stroke-light, #ccc);padding-inline-start:8px;color:var(--rcx-color-font-secondary-info, #666)',
		);
	});

	it('tints a spoiler block, which the parser does not currently produce', () => {
		const input = mountTokens([{ type: 'SPOILER_BLOCK', value: [paragraph('secret')] }]);

		expect(input.textContent).toBe('secret\n');
		expect(input.querySelector('span')?.getAttribute('style')).toBe(
			'background-color:var(--rcx-color-surface-tint, rgba(0, 0, 0, 0.08));border-radius:2px;padding:0 2px',
		);
	});

	it('puts a code block in a code element that owns its line', () => {
		const block = mountTokens(code(undefined, 'const a = 1;')).querySelector('code');

		expect(block?.className).toBe('code-colors');
		expect(block?.getAttribute('style')).toBe('display:inline-block;width:100%;vertical-align:top');
	});

	it.each([
		['fences a block with no language', code(undefined, 'const a = 1;'), '```\nconst a = 1;\n```'],
		['names the language on the opening fence', code('javascript', 'const a = 1;'), '```javascript\nconst a = 1;\n```'],
		['omits the placeholder language of an unlabelled block', code('none', 'const a = 1;'), '```\nconst a = 1;\n```'],
		['keeps every line of a multi-line block', code(undefined, 'a', '', 'b'), '```\na\n\nb\n```'],
	])('%s', (_label, tokens, expected) => {
		expect(textOfTokens(tokens)).toBe(expected);
	});

	it.each([
		['unordered', { type: 'UNORDERED_LIST', value: listItems('one', 'two') } as MessageParser.UnorderedList, ['- ', '- ']],
		['ordered', { type: 'ORDERED_LIST', value: listItems('one', 'two') } as MessageParser.OrderedList, ['1. ', '2. ']],
	])('emphasizes the marker of every %s list item', (_label, block, expected) => {
		const markers = Array.from(mountTokens([block]).querySelectorAll('span[style]'));

		expect(markers.map((marker) => marker.textContent)).toEqual(expected);

		for (const marker of markers) {
			expect(marker.getAttribute('style')).toBe('font-weight:700;padding-inline-start:0.5rem');
		}
	});

	it('keeps the numbers an ordered list was typed with instead of renumbering', () => {
		const block: MessageParser.OrderedList = {
			type: 'ORDERED_LIST',
			value: [
				{ type: 'LIST_ITEM', value: [plain('one')], number: 1 },
				{ type: 'LIST_ITEM', value: [plain('three')], number: 3 },
				{ type: 'LIST_ITEM', value: [plain('two')], number: 2 },
			],
		};

		expect(textOfTokens([block])).toBe('1. one\n3. three\n2. two\n');
	});
});

// TODO: As we implement these nodes, remove these tests
describe('blocks with no visual treatment yet', () => {
	it.each([
		['a task list', [tasks] as MessageParser.Root, '', '- [x] done\n- [ ] todo\n'],
		['a horizontal rule', [horizontalRule] as MessageParser.Root, '---', '---\n'],
		['a table', [table] as MessageParser.Root, TABLE_SOURCE, `${TABLE_SOURCE}\n`],
		['a big emoji block', [bigEmoji] as MessageParser.Root, '', ':smile:😄'],
	])('renders %s as the plain text it was typed as', (_label, tokens, source, expected) => {
		const input = mountTokens(tokens, source);

		expect(input.textContent).toBe(expected);
		expect(styledNodes(input)).toHaveLength(0);
	});

	it.each([
		['a horizontal rule', [horizontalRule] as MessageParser.Root, '---'],
		['a table', [table] as MessageParser.Root, TABLE_SOURCE],
		['a big emoji block', [bigEmoji] as MessageParser.Root, ''],
	])('emits no element at all for %s', (_label, tokens, source) => {
		expect(mountTokens(tokens, source).querySelectorAll('*')).toHaveLength(0);
	});

	it('gives a task only the bare spans every block gets, with no control of its own', () => {
		const input = mountTokens([tasks]);

		expect(input.querySelector('input')).toBeNull();
		expect(Array.from(input.querySelectorAll('span')).every((span) => span.attributes.length === 0)).toBe(true);
	});

	it('does not add a second line ending when the source already carries one', () => {
		const block: MessageParser.HorizontalRule = { type: 'HORIZONTAL_RULE', value: undefined, fallback: [0, 4] };

		expect(textOfTokens([block], '---\nafter')).toBe('---\n');
	});
});

describe('blocks with no renderer', () => {
	it('drops a katex block, which is why the composer must not enable katex parsing', () => {
		expect(textOfTokens([{ type: 'KATEX', value: 'x^2' }])).toBe('');
	});
});

describe('rendered with no context at all', () => {
	it('still renders the blocks that do not need the source', () => {
		expect(mountBareTokens([paragraph('hello')]).textContent).toBe('hello\n');
	});

	it('drops a node it can only rebuild from the source', () => {
		expect(mountBareTokens([horizontalRule]).textContent).toBe('\n');
	});
});

describe('every renderer emits the text it was parsed from', () => {
	it.each([
		['plain text', 'hello world'],
		['bold', 'a *bold* b'],
		['italic', 'a _em_ b'],
		['strike', 'a ~out~ b'],
		['spoiler', 'a ||hidden|| b'],
		['inline code', 'a `code` b'],
		['code block', '```js\nconst a = 1;\n```'],
		['heading', '# Title'],
		['heading with a link', '# see rocket.chat'],
		['quote', '> quoted'],
		['multiline', 'first\nsecond\nthird'],
		['user mention', 'hi @rocket.cat'],
		['channel mention', 'hi #general'],
		['markdown link', 'see [the docs](https://rocket.chat/docs)'],
		['bare domain', 'see rocket.chat/docs now'],
		['email', 'mail me@rocket.chat now'],
		['link inside bold', 'a *see rocket.chat* b'],
		['markdown link inside bold', 'a *[docs](https://rocket.chat)* b'],
		['link with an unsafe scheme', 'see [x](javascript:alert(1))'],
		['image', 'look ![alt](https://rocket.chat/a.png)'],
		['timestamp', 'at <t:1700000000:t> ok'],
		['horizontal rule', '---'],
		['horizontal rule between paragraphs', 'a\n---\nb'],
		['table', '|a|b|\n|-|-|\n|1|2|'],
		['hyphen list', '- one\n- two'],
		['list item with inline markup', '- *bold* one'],
		['list followed by a paragraph', '- one\ntext after'],
		['paragraph followed by a list', 'text before\n- one'],
		['lone hyphen marker', '- '],
		['ordered list', '1. one\n2. two'],
		['ordered list numbered out of order', '1. one\n3. three\n2. two'],
		['ordered list not starting at one', '7. seven\n8. eight'],
		['ordered list item with inline markup', '1. *bold* one'],
		['ordered list followed by a paragraph', '1. one\ntext after'],
		['tasks', '- [x] done\n- [ ] todo'],
		['emoji shortcode', 'hi :smile: there'],
		['emoji shortcode alone', ':smile:'],
		['unicode emoji in text', 'hi 😄 there'],
		['unicode emoji alone', '😄'],
	])('reproduces %s exactly', (_label, text) => {
		expect(textOf(mountSource(text))).toBe(text);
	});
});

describe('the exactness invariant holds for generated markup', () => {
	const word = fc.stringMatching(/^[a-zA-Z0-9]{1,8}$/);

	const inline = fc.oneof(
		word,
		word.map((value) => `*${value}*`),
		word.map((value) => `_${value}_`),
		word.map((value) => `~${value}~`),
		word.map((value) => `||${value}||`),
		word.map((value) => `\`${value}\``),
		word.map((value) => `@${value}`),
		word.map((value) => `#${value}`),
	);

	const line = fc.array(inline, { minLength: 1, maxLength: 4 }).map((parts) => parts.join(' '));

	const block = fc.oneof(
		line,
		line.map((value) => `# ${value}`),
		line.map((value) => `> ${value}`),
		fc.array(line, { minLength: 1, maxLength: 3 }).map((items) => items.map((item) => `- ${item}`).join('\n')),
		fc.array(line, { minLength: 1, maxLength: 3 }).map((items) => items.map((item, index) => `${index + 1}. ${item}`).join('\n')),
	);

	const document = fc.array(block, { minLength: 1, maxLength: 4 }).map((blocks) => blocks.join('\n'));

	it('reproduces generated markup character for character', () => {
		fc.assert(
			fc.property(document, (text) => {
				expect(textOf(mountSource(text))).toBe(text);
			}),
			{ numRuns: 300 },
		);
	});
});

describe('markup the renderer cannot reproduce', () => {
	it.each([
		['asterisk list', '* one\n* two'],
		['hyphen list with extra spacing', '-  one'],
		['ordered list with a leading zero', '01. one'],
		['ordered list with extra spacing', '1.  one'],
		['slack-style link', '<https://rocket.chat|docs>'],
		['phone link', 'call +15551234567 now'],
		['padded horizontal rule', '  ---'],
		['several big emoji', '😄 😄'],
	])('does not reproduce %s, so the caller must guard the text', (_label, text) => {
		expect(textOf(mountSource(text))).not.toBe(text);
	});
});

describe('link wiring', () => {
	it.each([
		['a markdown link', 'see [the docs](https://rocket.chat/docs)', '[the docs](https://rocket.chat/docs)', 'https://rocket.chat/docs'],
		['a bare domain', 'see rocket.chat/docs now', 'rocket.chat/docs', 'https://rocket.chat/docs'],
		['an email', 'mail me@rocket.chat now', 'me@rocket.chat', 'mailto:me@rocket.chat'],
	])('carries the parsed target of %s onto the anchor', (_label, text, expectedText, expectedHref) => {
		const anchors = anchorsOf(mountSource(text));

		expect(anchors).toHaveLength(1);
		expect(anchors[0].textContent).toBe(expectedText);
		expect(anchors[0].getAttribute('href')).toBe(expectedHref);
	});

	it('leaves a refused target without an href', () => {
		const anchors = anchorsOf(mountSource('see [x](javascript:alert(1))'));

		expect(anchors).toHaveLength(1);
		expect(anchors[0].getAttribute('href')).toBeNull();
	});

	it('styles every link like the message list does', () => {
		const [anchor] = anchorsOf(mountSource('see [the docs](https://rocket.chat/docs)'));

		expect(anchor.getAttribute('style')).toBe('color:var(--rcx-color-font-info, #095ad2);text-decoration:underline');
	});

	it('renders a link nested in the markup around it', () => {
		const [anchor] = anchorsOf(mountSource('a *[docs](https://rocket.chat)* b'));

		expect(anchor.closest('strong')).not.toBeNull();
	});
});

describe('the caret cannot be trapped', () => {
	const samples = [
		'hello world',
		'a *bold* _em_ ~out~ ||hidden|| `code` b',
		'# Title',
		'> quoted',
		'- one\n- two',
		'1. one\n2. two',
		'- [x] done',
		'```js\nconst a = 1;\n```',
		'see [the docs](https://rocket.chat/docs)',
		'look ![alt](https://rocket.chat/a.png)',
		'hi @rocket.cat and #general',
		'at <t:1700000000:t> ok',
		'|a|b|\n|-|-|\n|1|2|',
		'---',
		'see [<img src=x onerror=alert(1)>](https://rocket.chat/<script>alert(2)</script>)',
	];

	it.each(samples)('renders no focusable or interactive node for %j', (text) => {
		const input = mountSource(text);

		expect(input.querySelectorAll('img, button, input, textarea, select, iframe, script, object, embed')).toHaveLength(0);
		expect(input.querySelectorAll('[tabindex], [contenteditable], [onclick]')).toHaveLength(0);
	});

	it('never marks a subtree as non-editable inside the composer', () => {
		const input = mountSource('a *bold* [link](https://rocket.chat) @cat');

		expect(input.querySelectorAll('[aria-hidden="true"]')).toHaveLength(0);
	});
});
