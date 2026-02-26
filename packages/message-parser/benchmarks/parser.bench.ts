#!/usr/bin/env npx ts-node
/**
 * Benchmark suite for @rocket.chat/message-parser
 *
 * Measures parsing performance (ops/sec) across various message categories.
 * Run with: `yarn bench` from packages/message-parser/
 *
 * Flags:
 *   --skip <category1,category2,...>   Skip specific categories (comma-separated, case-insensitive)
 *   --only <category1,category2,...>   Run only specific categories (comma-separated, case-insensitive)
 *
 * Examples:
 *   yarn bench --skip "KaTeX (Math),Adversarial / Stress"
 *   yarn bench --only "Plain Text,Emoji"
 *
 * Uses a custom loader (pegjs-register.js) to compile .pegjs at runtime — no build needed.
 */

import { Bench, type Task } from 'tinybench';

import { parse } from '../src';
import type { Options } from '../src';

// ── Options presets ────────────────────────────────────────────────────────

const fullOptions: Options = {
	colors: true,
	emoticons: true,
	katex: {
		dollarSyntax: true,
		parenthesisSyntax: true,
	},
};

// ── Fixture type ───────────────────────────────────────────────────────────

type Fixture = {
	name: string;
	input: string;
	options?: Options;
};

type BenchCategory = {
	name: string;
	time?: number;
	warmupTime?: number;
	fixtures: Fixture[];
};

// ── Categories ─────────────────────────────────────────────────────────────

const categories: BenchCategory[] = [
	{
		name: 'Plain Text',
		fixtures: [
			{ name: 'short', input: 'Hello world' },
			{
				name: 'medium',
				input: 'The quick brown fox jumps over the lazy dog. This is a typical message one might send in a chat application.',
			},
			{ name: 'long', input: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(20).trim() },
		],
	},
	{
		name: 'Emphasis / Formatting',
		fixtures: [
			{ name: 'bold', input: '**Hello world**' },
			{ name: 'italic', input: '_Hello world_' },
			{ name: 'strike', input: '~~Hello world~~' },
			{ name: 'nested', input: '**bold _italic_ and ~~strike~~**' },
			{ name: 'deep nesting', input: '**bold _italic ~~strike _deep italic_~~_**' },
			{ name: 'multiple', input: '**bold** normal _italic_ normal ~~strike~~ **more bold** _more italic_' },
		],
	},
	{
		name: 'URLs & Links',
		fixtures: [
			{ name: 'single', input: 'Check out https://rocket.chat for more info' },
			{ name: 'multiple', input: 'Visit https://rocket.chat or https://github.com/RocketChat/Rocket.Chat or https://open.rocket.chat' },
			{ name: 'markdown link', input: '[Rocket.Chat](https://rocket.chat)' },
			{ name: 'autolinked domain', input: 'Visit rocket.chat for more info' },
			{ name: 'with path', input: 'See https://github.com/RocketChat/Rocket.Chat/tree/develop/packages/message-parser for details' },
		],
	},
	{
		name: 'Emoji',
		fixtures: [
			{ name: 'single shortcode', input: ':smile:', options: fullOptions },
			{ name: 'triple shortcode (BigEmoji)', input: ':smile::heart::rocket:', options: fullOptions },
			{ name: 'single unicode', input: '😀', options: fullOptions },
			{ name: 'triple unicode (BigEmoji)', input: '😀🚀🌈', options: fullOptions },
			{ name: 'in text', input: 'Hello :smile: world :heart: test :rocket: done', options: fullOptions },
			{ name: 'mixed', input: 'Great job :thumbsup: 🎉 keep going :rocket:', options: fullOptions },
		],
	},
	{
		name: 'Mentions',
		fixtures: [
			{ name: 'single user', input: '@admin' },
			{ name: 'multiple users', input: '@admin @user1 @moderator' },
			{ name: 'channel', input: '#general' },
			{ name: 'mixed', input: 'Hey @admin check #general and @user1' },
		],
	},
	{
		name: 'Code',
		fixtures: [
			{ name: 'inline', input: 'Use `console.log()` for debugging' },
			{ name: 'block', input: '```javascript\nconst x = 1;\nconsole.log(x);\n```' },
			{ name: 'multi inline', input: 'Use `Array.map()` and `Array.filter()` and `Array.reduce()`' },
		],
	},
	{
		name: 'Structured Blocks',
		fixtures: [
			{ name: 'ordered list', input: '1. First item\n2. Second item\n3. Third item' },
			{ name: 'unordered list', input: '- First item\n- Second item\n- Third item' },
			{ name: 'task list', input: '- [x] Done task\n- [ ] Pending task\n- [x] Another done' },
			{ name: 'blockquote', input: '> This is a quoted message\n> with multiple lines' },
			{ name: 'heading', input: '# Hello World' },
			{ name: 'heading multi-level', input: '# H1\n## H2\n### H3\n#### H4' },
			{ name: 'spoiler', input: '||This is a spoiler||' },
			{ name: 'spoiler with formatting', input: '||**bold** and _italic_ spoiler||' },
		],
	},
	{
		name: 'KaTeX (Math)',
		fixtures: [
			{ name: 'inline', input: 'The formula is $E = mc^2$ in physics', options: fullOptions },
			{ name: 'block', input: '$$\\sum_{i=1}^{n} x_i = x_1 + x_2 + ... + x_n$$', options: fullOptions },
		],
	},
	{
		name: 'Adversarial / Stress',
		time: 2000,
		warmupTime: 500,
		fixtures: [
			{
				name: 'adversarial emphasis',
				input: '**_**__**_**__**_**__**_**__**_**__**_**__**_**__**_**__**_**__**_**__**_**__**_**__**_**__**_**__**_**__**_**__',
			},
			{
				name: 'adversarial mixed',
				input:
					'This a message designed to stress test !!@#$%^&*()_+, overloading the symbols {}:"|<>?, some more text ,./;\'\\[], numbers too 1234567890-= let it call s o s ok~',
			},
			{ name: 'repeated specials', input: '****____~~~~||||````####>>>>' },
			{
				name: 'long with formatting',
				input: '**bold** _italic_ ~~strike~~ `code` @user #channel :smile: https://example.com '.repeat(10).trim(),
			},
		],
	},
	{
		name: 'Real-World Messages',
		fixtures: [
			{ name: 'simple', input: 'Hey team, the deploy is done ✅' },
			{
				name: 'medium',
				input:
					'@admin I pushed the fix to `develop` branch. Check https://github.com/RocketChat/Rocket.Chat/pull/12345 for details. :thumbsup:',
			},
			{
				name: 'complex',
				input:
					'**Release Notes v7.0**\n- [x] Fix #12345\n- [ ] Update docs\n\n> Important: check https://docs.rocket.chat\n\ncc @admin @devlead #releases :rocket:',
				options: fullOptions,
			},
		],
	},
	{
		name: 'Timestamps',
		fixtures: [{ name: 'unix format', input: '<t:1630360800:f>' }],
	},
];

// ── CLI argument parsing ───────────────────────────────────────────────────

function parseCLIFlags(): { skip: Set<string>; only: Set<string> } {
	const args = process.argv.slice(2);
	const result: { skip: Set<string>; only: Set<string> } = {
		skip: new Set(),
		only: new Set(),
	};

	for (let i = 0; i < args.length; i++) {
		const flag = args[i];
		const value = args[i + 1];

		if ((flag === '--skip' || flag === '--only') && value && !value.startsWith('--')) {
			const names = value
				.split(',')
				.map((s) => s.trim().toLowerCase())
				.filter(Boolean);

			names.forEach((n) => result[flag === '--skip' ? 'skip' : 'only'].add(n));
			i++; // consume the value token
		}
	}

	return result;
}

function filterCategories(all: BenchCategory[]): BenchCategory[] {
	const { skip, only } = parseCLIFlags();
	const allNames = all.map((c) => c.name.toLowerCase());

	if (only.size > 0 && skip.size > 0) {
		console.warn('⚠  Both --only and --skip were provided. --skip will be ignored.\n');
	}

	// Warn about unrecognised names
	const checkUnknown = (flags: Set<string>, flagName: string) => {
		flags.forEach((f) => {
			if (!allNames.includes(f)) {
				console.warn(`⚠  Unknown category in ${flagName}: "${f}"`);
				console.warn(`   Available categories: ${all.map((c) => `"${c.name}"`).join(', ')}\n`);
			}
		});
	};

	if (only.size > 0) {
		checkUnknown(only, '--only');
		return all.filter((c) => only.has(c.name.toLowerCase()));
	}

	if (skip.size > 0) {
		checkUnknown(skip, '--skip');
		return all.filter((c) => !skip.has(c.name.toLowerCase()));
	}

	return all;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatResults(tasks: Task[]) {
	return tasks.map((task) => ({
		'Task': task.name,
		'ops/sec': Math.round(task.result?.hz ?? 0).toLocaleString(),
		'Avg (ms)': ((task.result?.mean ?? 0) * 1000).toFixed(4),
		'Min (ms)': ((task.result?.min ?? 0) * 1000).toFixed(4),
		'Max (ms)': ((task.result?.max ?? 0) * 1000).toFixed(4),
		'P99 (ms)': ((task.result?.p99 ?? 0) * 1000).toFixed(4),
		'Samples': task.result?.samples?.length ?? 0,
	}));
}

// ── Runner ─────────────────────────────────────────────────────────────────

async function run() {
	const selected = filterCategories(categories);

	if (selected.length === 0) {
		console.error('No categories matched the provided flags. Nothing to run.');
		process.exit(1);
	}

	const skipped = categories.length - selected.length;

	console.log('='.repeat(72));
	console.log('  @rocket.chat/message-parser — Performance Benchmark Suite');
	console.log('='.repeat(72));

	if (skipped > 0) {
		console.log(`  Running ${selected.length} of ${categories.length} categories (${skipped} skipped)`);
	}

	console.log();

	// Benchmarks must run sequentially to avoid interference
	// eslint-disable-next-line no-restricted-syntax
	for (const category of selected) {
		const bench = new Bench({
			time: category.time ?? 1000,
			warmupTime: category.warmupTime ?? 200,
		});

		for (const fixture of category.fixtures) {
			bench.add(fixture.name, () => parse(fixture.input, fixture.options));
		}

		// eslint-disable-next-line no-await-in-loop
		await bench.run();

		console.log(`── ${category.name} ${'─'.repeat(Math.max(0, 56 - category.name.length))}`);
		console.table(formatResults(bench.tasks));
		console.log();
	}

	console.log('='.repeat(72));
	console.log('  Done.');
	console.log('='.repeat(72));
}

run().catch((err) => {
	console.error(err);
	process.exit(1);
});
