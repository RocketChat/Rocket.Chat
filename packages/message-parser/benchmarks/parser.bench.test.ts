/**
 * Benchmark suite for @rocket.chat/message-parser
 *
 * Measures parsing performance (ops/sec) across various message categories.
 * Run with: `yarn bench` from packages/message-parser/
 *
 * This file runs via Jest (to leverage the .pegjs transform) with a long timeout.
 *
 * Categories tested:
 *  - Plain text (simple, no formatting)
 *  - Rich formatting (bold, italic, strike, nested emphasis)
 *  - URLs and auto-linking
 *  - Emoji (shortcodes, unicode, big emoji)
 *  - Mentions (@user, #channel)
 *  - Code blocks and inline code
 *  - Adversarial / stress-test inputs
 *  - Mixed real-world messages
 */

import { Bench } from 'tinybench';

import { parse } from '../src';
import type { Options } from '../src';

// ── Test Fixtures ──────────────────────────────────────────────────────────

const fixtures = {
	// Category 1: Plain text
	plainShort: 'Hello world',
	plainMedium: 'The quick brown fox jumps over the lazy dog. This is a typical message one might send in a chat application.',
	plainLong: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(20).trim(),

	// Category 2: Rich formatting
	boldSimple: '**Hello world**',
	italicSimple: '_Hello world_',
	strikeSimple: '~~Hello world~~',
	nestedEmphasis: '**bold _italic_ and ~~strike~~**',
	deepNesting: '**bold _italic ~~strike _deep italic_~~_**',
	multipleEmphasis: '**bold** normal _italic_ normal ~~strike~~ **more bold** _more italic_',

	// Category 3: URLs
	singleUrl: 'Check out https://rocket.chat for more info',
	multipleUrls: 'Visit https://rocket.chat or https://github.com/RocketChat/Rocket.Chat or https://open.rocket.chat',
	markdownLink: '[Rocket.Chat](https://rocket.chat)',
	autolinkedDomain: 'Visit rocket.chat for more info',
	urlWithPath: 'See https://github.com/RocketChat/Rocket.Chat/tree/develop/packages/message-parser for details',

	// Category 4: Emoji
	singleEmoji: ':smile:',
	tripleEmoji: ':smile::heart::rocket:',
	unicodeEmoji: '😀',
	tripleUnicodeEmoji: '😀🚀🌈',
	emojiInText: 'Hello :smile: world :heart: test :rocket: done',
	mixedEmoji: 'Great job :thumbsup: 🎉 keep going :rocket:',

	// Category 5: Mentions
	singleMention: '@admin',
	multipleMentions: '@admin @user1 @moderator',
	channelMention: '#general',
	mixedMentions: 'Hey @admin check #general and @user1',

	// Category 6: Code
	inlineCode: 'Use `console.log()` for debugging',
	codeBlock: '```javascript\nconst x = 1;\nconsole.log(x);\n```',
	multiInlineCode: 'Use `Array.map()` and `Array.filter()` and `Array.reduce()`',

	// Category 7: Lists
	orderedList: '1. First item\n2. Second item\n3. Third item',
	unorderedList: '- First item\n- Second item\n- Third item',
	taskList: '- [x] Done task\n- [ ] Pending task\n- [x] Another done',

	// Category 8: Blockquote
	blockquote: '> This is a quoted message\n> with multiple lines',

	// Category 9: KaTeX (math)
	katexInline: 'The formula is $E = mc^2$ in physics',
	katexBlock: '$$\\sum_{i=1}^{n} x_i = x_1 + x_2 + ... + x_n$$',

	// Category 10: Adversarial / stress test
	adversarialEmphasis:
		'**_**__**_**__**_**__**_**__**_**__**_**__**_**__**_**__**_**__**_**__**_**__**_**__**_**__**_**__**_**__**_**__',
	adversarialMixed:
		'This a message designed to stress test !!@#$%^&*()_+, overloading the symbols {}:"|<>?, some more text ,./;\'\\[], numbers too 1234567890-= let it call s o s ok~',
	repeatedSpecials: '****____~~~~||||````####>>>>',
	longWithFormatting:
		'**bold** _italic_ ~~strike~~ `code` @user #channel :smile: https://example.com '.repeat(10).trim(),

	// Category 11: Real-world mixed messages
	realWorldSimple: 'Hey team, the deploy is done ✅',
	realWorldMedium:
		'@admin I pushed the fix to `develop` branch. Check https://github.com/RocketChat/Rocket.Chat/pull/12345 for details. :thumbsup:',
	realWorldComplex:
		'**Release Notes v7.0**\n- [x] Fix #12345\n- [ ] Update docs\n\n> Important: check https://docs.rocket.chat\n\ncc @admin @devlead #releases :rocket:',

	// Category 12: Heading
	heading: '# Hello World',
	headingMultiLevel: '# H1\n## H2\n### H3\n#### H4',

	// Category 13: Spoiler
	spoiler: '||This is a spoiler||',
	spoilerWithFormatting: '||**bold** and _italic_ spoiler||',

	// Category 14: Timestamps
	timestampUnix: '<t:1630360800:f>',
};

// ── Options presets ────────────────────────────────────────────────────────

const defaultOptions: Options = {};

const fullOptions: Options = {
	colors: true,
	emoticons: true,
	katex: {
		dollarSyntax: true,
		parenthesisSyntax: true,
	},
};

// ── Benchmark runner ───────────────────────────────────────────────────────

async function runBenchmarks() {
	console.log('='.repeat(72));
	console.log('  @rocket.chat/message-parser — Performance Benchmark Suite');
	console.log('='.repeat(72));
	console.log();

	// Group 1: Plain text parsing
	const plainTextBench = new Bench({ time: 1000, warmupTime: 200 });
	plainTextBench
		.add('plain: short', () => parse(fixtures.plainShort))
		.add('plain: medium', () => parse(fixtures.plainMedium))
		.add('plain: long', () => parse(fixtures.plainLong));

	// Group 2: Emphasis / formatting
	const emphasisBench = new Bench({ time: 1000, warmupTime: 200 });
	emphasisBench
		.add('emphasis: bold', () => parse(fixtures.boldSimple))
		.add('emphasis: italic', () => parse(fixtures.italicSimple))
		.add('emphasis: strike', () => parse(fixtures.strikeSimple))
		.add('emphasis: nested', () => parse(fixtures.nestedEmphasis))
		.add('emphasis: deep nesting', () => parse(fixtures.deepNesting))
		.add('emphasis: multiple', () => parse(fixtures.multipleEmphasis));

	// Group 3: URLs
	const urlBench = new Bench({ time: 1000, warmupTime: 200 });
	urlBench
		.add('url: single', () => parse(fixtures.singleUrl))
		.add('url: multiple', () => parse(fixtures.multipleUrls))
		.add('url: markdown link', () => parse(fixtures.markdownLink))
		.add('url: autolinked domain', () => parse(fixtures.autolinkedDomain))
		.add('url: with path', () => parse(fixtures.urlWithPath));

	// Group 4: Emoji
	const emojiBench = new Bench({ time: 1000, warmupTime: 200 });
	emojiBench
		.add('emoji: single shortcode', () => parse(fixtures.singleEmoji))
		.add('emoji: triple shortcode (BigEmoji)', () => parse(fixtures.tripleEmoji))
		.add('emoji: single unicode', () => parse(fixtures.unicodeEmoji))
		.add('emoji: triple unicode (BigEmoji)', () => parse(fixtures.tripleUnicodeEmoji))
		.add('emoji: in text', () => parse(fixtures.emojiInText))
		.add('emoji: mixed', () => parse(fixtures.mixedEmoji));

	// Group 5: Mentions
	const mentionBench = new Bench({ time: 1000, warmupTime: 200 });
	mentionBench
		.add('mention: single user', () => parse(fixtures.singleMention))
		.add('mention: multiple users', () => parse(fixtures.multipleMentions))
		.add('mention: channel', () => parse(fixtures.channelMention))
		.add('mention: mixed', () => parse(fixtures.mixedMentions));

	// Group 6: Code
	const codeBench = new Bench({ time: 1000, warmupTime: 200 });
	codeBench
		.add('code: inline', () => parse(fixtures.inlineCode))
		.add('code: block', () => parse(fixtures.codeBlock))
		.add('code: multi inline', () => parse(fixtures.multiInlineCode));

	// Group 7: Structured blocks
	const blockBench = new Bench({ time: 1000, warmupTime: 200 });
	blockBench
		.add('block: ordered list', () => parse(fixtures.orderedList))
		.add('block: unordered list', () => parse(fixtures.unorderedList))
		.add('block: task list', () => parse(fixtures.taskList))
		.add('block: blockquote', () => parse(fixtures.blockquote))
		.add('block: heading', () => parse(fixtures.heading))
		.add('block: heading multi-level', () => parse(fixtures.headingMultiLevel))
		.add('block: spoiler', () => parse(fixtures.spoiler));

	// Group 8: KaTeX (with options enabled)
	const katexBench = new Bench({ time: 1000, warmupTime: 200 });
	katexBench
		.add('katex: inline', () => parse(fixtures.katexInline, fullOptions))
		.add('katex: block', () => parse(fixtures.katexBlock, fullOptions));

	// Group 9: Adversarial / stress
	const stressBench = new Bench({ time: 2000, warmupTime: 500 });
	stressBench
		.add('stress: adversarial emphasis', () => parse(fixtures.adversarialEmphasis))
		.add('stress: adversarial mixed', () => parse(fixtures.adversarialMixed))
		.add('stress: repeated specials', () => parse(fixtures.repeatedSpecials))
		.add('stress: long with formatting', () => parse(fixtures.longWithFormatting));

	// Group 10: Real-world
	const realWorldBench = new Bench({ time: 1000, warmupTime: 200 });
	realWorldBench
		.add('real-world: simple', () => parse(fixtures.realWorldSimple))
		.add('real-world: medium', () => parse(fixtures.realWorldMedium))
		.add('real-world: complex', () => parse(fixtures.realWorldComplex, fullOptions));

	// Group 11: Timestamps
	const timestampBench = new Bench({ time: 1000, warmupTime: 200 });
	timestampBench.add('timestamp: unix format', () => parse(fixtures.timestampUnix));

	// ── Run all benchmarks ─────────────────────────────────────────────────

	const groups = [
		{ name: 'Plain Text', bench: plainTextBench },
		{ name: 'Emphasis / Formatting', bench: emphasisBench },
		{ name: 'URLs & Links', bench: urlBench },
		{ name: 'Emoji', bench: emojiBench },
		{ name: 'Mentions', bench: mentionBench },
		{ name: 'Code', bench: codeBench },
		{ name: 'Structured Blocks', bench: blockBench },
		{ name: 'KaTeX (Math)', bench: katexBench },
		{ name: 'Adversarial / Stress', bench: stressBench },
		{ name: 'Real-World Messages', bench: realWorldBench },
		{ name: 'Timestamps', bench: timestampBench },
	];

	for (const { name, bench } of groups) {
		console.log(`── ${name} ${'─'.repeat(Math.max(0, 56 - name.length))}`);
		await bench.run();
		console.table(
			bench.tasks.map((task) => ({
				'Task': task.name,
				'ops/sec': Math.round(task.result!.hz).toLocaleString(),
				'Avg (ms)': (task.result!.mean * 1000).toFixed(4),
				'Min (ms)': (task.result!.min * 1000).toFixed(4),
				'Max (ms)': (task.result!.max * 1000).toFixed(4),
				'P99 (ms)': (task.result!.p99 * 1000).toFixed(4),
				'Samples': task.result!.samples.length,
			})),
		);
		console.log();
	}

	// ── Summary ────────────────────────────────────────────────────────────

	console.log('='.repeat(72));
	console.log('  Summary');
	console.log('='.repeat(72));

	const allTasks = groups.flatMap(({ bench }) => bench.tasks);
	const sorted = [...allTasks].sort((a, b) => a.result!.hz - b.result!.hz);

	console.log('\n  Slowest operations (potential optimization targets):');
	for (const task of sorted.slice(0, 5)) {
		console.log(`    ${Math.round(task.result!.hz).toLocaleString().padStart(12)} ops/sec  │  ${task.name}`);
	}

	console.log('\n  Fastest operations:');
	for (const task of sorted.slice(-5).reverse()) {
		console.log(`    ${Math.round(task.result!.hz).toLocaleString().padStart(12)} ops/sec  │  ${task.name}`);
	}

	console.log();
}

it(
	'benchmark: message-parser performance',
	async () => {
		await runBenchmarks();
	},
	120_000,
);
