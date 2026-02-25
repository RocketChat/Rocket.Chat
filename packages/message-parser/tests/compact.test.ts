import { parse } from '../src';
import type { Root } from '../src';
import { compactify, expand, validateRoundtrip } from '../src/compact';
import type { CRoot } from '../src/compact';

const fullOptions = {
	colors: true,
	emoticons: true,
	katex: { dollarSyntax: true, parenthesisSyntax: true },
};

// ── roundtrip helper ─────────────────────────────────────────────────────────

function expectRoundtrip(msg: string, options?: Parameters<typeof parse>[1]) {
	const oldMd = parse(msg, options);
	const result = validateRoundtrip(oldMd, msg);

	if (!result.ok) {
		console.log('Old:', JSON.stringify(oldMd, null, 2));
		console.log('Compact:', JSON.stringify(result.compact, null, 2));
		console.log('Expanded:', JSON.stringify(result.expanded, null, 2));
	}

	expect(result.ok).toBe(true);
	expect(result.sizeNew).toBeLessThan(result.sizeOld);
}

// ── expand helper (compact → verbose must produce same AST) ──────────────────

function expectExpand(msg: string, compact: CRoot, expectedOld: Root) {
	const expanded = expand(compact, msg);
	expect(expanded).toEqual(expectedOld);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Test suites
// ═══════════════════════════════════════════════════════════════════════════════

describe('expand (compact → verbose)', () => {
	it('plain text', () => {
		expectExpand('Hello world', [{ t: 'p', c: [[0, 11]] }], [{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: 'Hello world' }] }]);
	});

	it('user mention', () => {
		expectExpand(
			'@admin',
			[{ t: 'p', c: [{ t: '@', r: [1, 6] }] }],
			[{ type: 'PARAGRAPH', value: [{ type: 'MENTION_USER', value: { type: 'PLAIN_TEXT', value: 'admin' } }] }],
		);
	});

	it('channel mention', () => {
		expectExpand(
			'#general',
			[{ t: 'p', c: [{ t: '#', r: [1, 8] }] }],
			[{ type: 'PARAGRAPH', value: [{ type: 'MENTION_CHANNEL', value: { type: 'PLAIN_TEXT', value: 'general' } }] }],
		);
	});

	it('inline code', () => {
		expectExpand(
			'use `code` here',
			[{ t: 'p', c: [[0, 4], { t: '`', r: [5, 9] }, [10, 15]] }],
			[
				{
					type: 'PARAGRAPH',
					value: [
						{ type: 'PLAIN_TEXT', value: 'use ' },
						{ type: 'INLINE_CODE', value: { type: 'PLAIN_TEXT', value: 'code' } },
						{ type: 'PLAIN_TEXT', value: ' here' },
					],
				},
			],
		);
	});

	it('autolink (no s = href equals text)', () => {
		expectExpand(
			'https://rocket.chat',
			[{ t: 'p', c: [{ t: 'a', r: [0, 19] }] }],
			[
				{
					type: 'PARAGRAPH',
					value: [
						{
							type: 'LINK',
							value: {
								src: { type: 'PLAIN_TEXT', value: 'https://rocket.chat' },
								label: [{ type: 'PLAIN_TEXT', value: 'https://rocket.chat' }],
							},
						},
					],
				},
			],
		);
	});

	it('link with different href', () => {
		expectExpand(
			'[RC](https://rocket.chat)',
			[{ t: 'p', c: [{ t: 'a', r: [1, 3], s: 'https://rocket.chat' }] }],
			[
				{
					type: 'PARAGRAPH',
					value: [
						{
							type: 'LINK',
							value: {
								src: { type: 'PLAIN_TEXT', value: 'https://rocket.chat' },
								label: [{ type: 'PLAIN_TEXT', value: 'RC' }],
							},
						},
					],
				},
			],
		);
	});

	it('shortcode emoji', () => {
		expectExpand(':smile:', [{ t: 'E', c: [{ t: ':', r: [1, 6] }] }], [
			{ type: 'BIG_EMOJI', value: [{ type: 'EMOJI', value: { type: 'PLAIN_TEXT', value: 'smile' }, shortCode: 'smile' }] },
		] as unknown as Root);
	});

	it('unicode emoji', () => {
		expectExpand('😀', [{ t: 'E', c: [{ t: ':', r: [0, 2], u: true }] }], [
			{ type: 'BIG_EMOJI', value: [{ type: 'EMOJI', value: undefined, unicode: '😀' }] },
		] as unknown as Root);
	});

	it('heading', () => {
		expectExpand('## Title', [{ t: 'h', l: 2, r: [3, 8] }], [
			{ type: 'HEADING', level: 2, value: [{ type: 'PLAIN_TEXT', value: 'Title' }] },
		] as unknown as Root);
	});

	it('code block', () => {
		expectExpand('```js\nlet x = 1;\n```', [{ t: '```', l: 'js', r: [6, 16] }], [
			{
				type: 'CODE',
				language: 'js',
				value: [{ type: 'CODE_LINE', value: { type: 'PLAIN_TEXT', value: 'let x = 1;' } }],
			},
		] as unknown as Root);
	});

	it('line break', () => {
		expectExpand('\n', [{ t: 'br' }], [{ type: 'LINE_BREAK', value: undefined }] as unknown as Root);
	});
});

describe('compactify (verbose → compact)', () => {
	it('plain text', () => {
		const msg = 'Hello world';
		const oldMd = parse(msg);
		const compact = compactify(oldMd, msg);
		expect(compact).toEqual([{ t: 'p', c: [[0, 11]] }]);
	});

	it('user mention', () => {
		const msg = '@admin';
		const compact = compactify(parse(msg), msg);
		expect(compact).toEqual([{ t: 'p', c: [{ t: '@', r: [1, 6] }] }]);
	});

	it('bold text', () => {
		const msg = '**hello**';
		const compact = compactify(parse(msg), msg);
		expect(compact).toEqual([{ t: 'p', c: [{ t: 'b', c: [[2, 7]] }] }]);
	});

	it('italic text', () => {
		const msg = '_hello_';
		const compact = compactify(parse(msg), msg);
		expect(compact).toEqual([{ t: 'p', c: [{ t: 'i', c: [[1, 6]] }] }]);
	});

	it('strike text', () => {
		const msg = '~~hello~~';
		const compact = compactify(parse(msg), msg);
		expect(compact).toEqual([{ t: 'p', c: [{ t: 's', c: [[2, 7]] }] }]);
	});

	it('inline code', () => {
		const msg = 'use `code` here';
		const compact = compactify(parse(msg), msg);
		expect(compact).toEqual([{ t: 'p', c: [[0, 4], { t: '`', r: [5, 9] }, [10, 15]] }]);
	});

	it('shortcode emoji', () => {
		const msg = ':smile:';
		const compact = compactify(parse(msg), msg);
		expect(compact).toEqual([{ t: 'E', c: [{ t: ':', r: [1, 6] }] }]);
	});

	it('unicode emoji', () => {
		const msg = '😀';
		const compact = compactify(parse(msg), msg);
		expect(compact).toEqual([{ t: 'E', c: [{ t: ':', r: [0, 2], u: true }] }]);
	});

	it('heading', () => {
		const msg = '## Title';
		const compact = compactify(parse(msg), msg);
		expect(compact).toEqual([{ t: 'h', l: 2, r: [3, 8] }]);
	});
});

describe('roundtrip (verbose → compact → verbose)', () => {
	describe('plain text', () => {
		it.each(['Hello world', 'The quick brown fox jumps over the lazy dog.', 'free text, with comma'])('%s', (msg) => expectRoundtrip(msg));
	});

	describe('emphasis / formatting', () => {
		it.each(['**Hello world**', '_Hello world_', '~~Hello world~~', '**bold _italic_ and ~~strike~~**'])('%s', (msg) =>
			expectRoundtrip(msg),
		);
	});

	describe('mentions', () => {
		it.each(['@admin', '@admin @user1 @moderator', '#general', 'Hey @admin check #general and @user1'])('%s', (msg) =>
			expectRoundtrip(msg),
		);
	});

	describe('code', () => {
		it.each(['Use `console.log()` for debugging', 'Use `Array.map()` and `Array.filter()` and `Array.reduce()`'])('%s', (msg) =>
			expectRoundtrip(msg),
		);

		it('code block', () => {
			expectRoundtrip('```javascript\nconst x = 1;\nconsole.log(x);\n```');
		});
	});

	describe('emoji', () => {
		it.each([':smile:', '😀', '😀🚀🌈', ':smile::heart::rocket:'])('%s', (msg) => expectRoundtrip(msg));
	});

	describe('links', () => {
		it.each(['Check out https://rocket.chat for more info', '[Rocket.Chat](https://rocket.chat)'])('%s', (msg) => expectRoundtrip(msg));
	});

	describe('structured blocks', () => {
		it('ordered list', () => expectRoundtrip('1. First item\n2. Second item\n3. Third item'));
		it('unordered list', () => expectRoundtrip('- First item\n- Second item\n- Third item'));
		it('task list', () => expectRoundtrip('- [x] Done task\n- [ ] Pending task\n- [x] Another done'));
		it('heading', () => expectRoundtrip('# Hello World'));
		it('heading multi-level', () => expectRoundtrip('# H1\n## H2\n### H3\n#### H4'));
	});

	describe('katex', () => {
		it('inline', () => expectRoundtrip('The formula is $E = mc^2$ in physics', fullOptions));
		it('block', () => expectRoundtrip('$$\\sum_{i=1}^{n} x_i$$', fullOptions));
	});

	describe('timestamp', () => {
		it('unix format', () => expectRoundtrip('<t:1630360800:f>'));
	});

	describe('emoticons', () => {
		it.each([':)', 'Hi :)', 'D:'])('%s', (msg) => expectRoundtrip(msg, { emoticons: true }));
	});

	describe('real-world messages', () => {
		it('simple', () => expectRoundtrip('Hey team, the deploy is done ✅'));

		it('medium', () =>
			expectRoundtrip(
				'@admin I pushed the fix to `develop` branch. Check https://github.com/RocketChat/Rocket.Chat/pull/12345 for details. :thumbsup:',
			));
	});
});

describe('roundtrip – benchmark fixtures', () => {
	describe('plain text', () => {
		it('long', () => expectRoundtrip('Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(20).trim()));
	});

	describe('emphasis / formatting', () => {
		it('nested', () => expectRoundtrip('**bold _italic_ and ~~strike~~**'));
		it('deep nesting', () => expectRoundtrip('**bold _italic ~~strike _deep italic_~~_**'));
		it('multiple', () => expectRoundtrip('**bold** normal _italic_ normal ~~strike~~ **more bold** _more italic_'));
	});

	describe('urls & links', () => {
		it('multiple', () =>
			expectRoundtrip('Visit https://rocket.chat or https://github.com/RocketChat/Rocket.Chat or https://open.rocket.chat'));
		it('with path', () =>
			expectRoundtrip('See https://github.com/RocketChat/Rocket.Chat/tree/develop/packages/message-parser for details'));
	});

	describe('emoji', () => {
		it('in text', () => expectRoundtrip('Hello :smile: world :heart: test :rocket: done'));
		it('mixed', () => expectRoundtrip('Great job :thumbsup: 🎉 keep going :rocket:'));
	});

	describe('code', () => {
		it('multi inline', () => expectRoundtrip('Use `Array.map()` and `Array.filter()` and `Array.reduce()`'));
	});

	describe('structured blocks', () => {
		it('blockquote', () => expectRoundtrip('> This is a quoted message\n> with multiple lines'));
		it('spoiler', () => expectRoundtrip('||This is a spoiler||'));
		it('spoiler with formatting', () => expectRoundtrip('||**bold** and _italic_ spoiler||'));
	});

	describe('real-world complex', () => {
		it('complex', () =>
			expectRoundtrip(
				'**Release Notes v7.0**\n- [x] Fix #12345\n- [ ] Update docs\n\n> Important: check https://docs.rocket.chat\n\ncc @admin @devlead #releases :rocket:',
				fullOptions,
			));
	});

	describe('adversarial', () => {
		it('long with formatting', () =>
			expectRoundtrip('**bold** _italic_ ~~strike~~ `code` @user #channel :smile: https://example.com '.repeat(10).trim()));
	});
});

describe('size reduction', () => {
	it.each([
		['plain short', 'Hello world'],
		['plain medium', 'The quick brown fox jumps over the lazy dog. This is a typical message.'],
		['with URL', 'Check https://github.com/RocketChat/Rocket.Chat/pull/12345 for details.'],
		['with mention', '@admin I pushed the fix to `develop` branch.'],
		[
			'real-world medium',
			'@admin I pushed the fix to `develop` branch. Check https://github.com/RocketChat/Rocket.Chat/pull/12345 for details. :thumbsup:',
		],
	])('%s: compact < verbose', (_label, msg) => {
		const oldMd = parse(msg);
		const result = validateRoundtrip(oldMd, msg);
		expect(result.ok).toBe(true);
		expect(result.sizeNew).toBeLessThan(result.sizeOld);

		console.log(`  ${_label}: ${result.sizeOld}B → ${result.sizeNew}B (${result.reduction})`);
	});
});
